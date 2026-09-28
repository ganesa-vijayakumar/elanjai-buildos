package com.elanjaibuildos.backend.platform.service;

import com.elanjaibuildos.backend.platform.model.TenantNotification;
import com.elanjaibuildos.backend.platform.repository.TenantNotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Queues outbound notifications (tenant_notifications) and delivers pending
 * email rows via SMTP on a schedule. Mailpit in dev captures everything.
 */
@Service
public class PlatformMailService {

    private static final Logger log = LoggerFactory.getLogger(PlatformMailService.class);

    private final TenantNotificationRepository notifications;
    private final JavaMailSender mailSender;

    @Value("${app.mail.from:no-reply@elanjai.local}")
    private String from;

    public PlatformMailService(TenantNotificationRepository notifications, JavaMailSender mailSender) {
        this.notifications = notifications;
        this.mailSender = mailSender;
    }

    public void queueEmail(UUID tenantId, String type, String recipient,
                           String subject, String body) {
        TenantNotification n = new TenantNotification();
        n.setTenantId(tenantId);
        n.setChannel("email");
        n.setType(type);
        n.setRecipient(recipient);
        n.setPayload(Map.of("subject", subject, "body", body));
        notifications.save(n);
    }

    /** Immediate send for signup verification — never fails the request: falls back to queue. */
    public void sendNow(String to, String subject, String body) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(from);
            msg.setTo(to);
            msg.setSubject(subject);
            msg.setText(body);
            mailSender.send(msg);
        } catch (Exception e) {
            // SMTP down (e.g. Mailpit not running) → queue for the scheduled flush
            log.warn("SMTP send failed ({}), queueing for retry to {}", e.getMessage(), to);
            queueEmail(null, "retry", to, subject, body);
        }
    }

    @Scheduled(fixedDelayString = "${app.mail.poll-ms:30000}")
    @Transactional
    public void flushQueue() {
        for (TenantNotification n : notifications.findTop50ByStatusOrderByCreatedAtAsc("pending")) {
            if (!"email".equals(n.getChannel()) || n.getRecipient() == null) continue;
            try {
                Object subj = n.getPayload() != null ? n.getPayload().get("subject") : null;
                Object body = n.getPayload() != null ? n.getPayload().get("body") : null;
                sendNow(n.getRecipient(),
                        subj != null ? subj.toString() : "ElanjaiBuildos notification",
                        body != null ? body.toString() : "");
                n.setStatus("sent");
                n.setSentAt(Instant.now());
            } catch (Exception e) {
                n.setStatus("failed");
                log.warn("Notification {} delivery failed: {}", n.getId(), e.getMessage());
            }
        }
    }
}
