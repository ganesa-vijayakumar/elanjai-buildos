package com.elanjaibuildos.backend.platform.service;

import com.elanjaibuildos.backend.platform.domain.Invoice;
import com.elanjaibuildos.backend.platform.domain.Subscription;
import com.elanjaibuildos.backend.platform.domain.Tenant;
import com.elanjaibuildos.backend.platform.domain.ProcessedWebhookEvent;
import com.elanjaibuildos.backend.platform.repository.InvoiceRepository;
import com.elanjaibuildos.backend.platform.repository.ProcessedWebhookEventRepository;
import com.elanjaibuildos.backend.platform.repository.SubscriptionRepository;
import com.elanjaibuildos.backend.platform.repository.TenantRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;

/**
 * Razorpay billing (D-021, one-time payment per cycle):
 *  - create Order for plan price (₹ → paise)
 *  - verify payment signature (order_id|payment_id → HMAC-SHA256)
 *  - webhook processing: signature-verified, idempotent by event id,
 *    out-of-order safe (status only moves forward).
 */
@Service
public class RazorpayService {

    private static final Logger log = LoggerFactory.getLogger(RazorpayService.class);

    private final TenantRepository tenants;
    private final SubscriptionRepository subscriptions;
    private final InvoiceRepository invoices;
    private final ProcessedWebhookEventRepository processed;
    private final TenantLifecycleService lifecycle;
    private final AuditService audit;
    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${app.razorpay.key-id:}")
    private String keyId;
    @Value("${app.razorpay.key-secret:}")
    private String keySecret;
    @Value("${app.razorpay.webhook-secret:}")
    private String webhookSecret;
    @Value("${app.razorpay.enabled:false}")
    private boolean enabled;

    public RazorpayService(TenantRepository tenants, SubscriptionRepository subscriptions,
                           InvoiceRepository invoices, ProcessedWebhookEventRepository processed,
                           TenantLifecycleService lifecycle, AuditService audit) {
        this.tenants = tenants; this.subscriptions = subscriptions;
        this.invoices = invoices; this.processed = processed;
        this.lifecycle = lifecycle; this.audit = audit;
    }

    public boolean isEnabled() { return enabled && keyId != null && !keyId.isBlank(); }
    public String keyId() { return keyId; }

    private RestClient client() {
        return RestClient.builder()
                .baseUrl("https://api.razorpay.com/v1")
                .defaultHeader("Authorization", "Basic " + Base64.getEncoder()
                        .encodeToString((keyId + ":" + keySecret).getBytes(StandardCharsets.UTF_8)))
                .build();
    }

    /** Create a Razorpay order for the plan amount; returns {orderId, amount, currency, keyId}. */
    public Map<String, Object> createOrder(Tenant tenant, long amountInr) {
        if (!isEnabled()) {
            throw new IllegalStateException("RAZORPAY_DISABLED");
        }
        Map<String, Object> body = Map.of(
                "amount", amountInr * 100,
                "currency", "INR",
                "receipt", "tenant-" + tenant.getId(),
                "notes", Map.of("tenant_slug", tenant.getSlug()));
        JsonNode res = client().post().uri("/orders")
                .contentType(MediaType.APPLICATION_JSON).body(body)
                .retrieve().body(JsonNode.class);
        return Map.of(
                "orderId", res.get("id").asText(),
                "amount", res.get("amount").asLong(),
                "currency", res.get("currency").asText(),
                "keyId", keyId);
    }

    /** Checkout callback: verify razorpay_signature over order_id|payment_id. */
    public boolean verifyPaymentSignature(String orderId, String paymentId, String signature) {
        String payload = orderId + "|" + paymentId;
        return hmacSha256(payload, keySecret).equals(signature);
    }

    /** Webhook: verify X-Razorpay-Signature, dedupe by event id, dispatch. */
    @Transactional
    public boolean handleWebhook(String body, String signatureHeader) {
        if (webhookSecret == null || webhookSecret.isBlank()) return false;
        if (!hmacSha256(body, webhookSecret).equals(signatureHeader)) {
            audit.logSystem("webhook.bad_signature", "webhook", null, Map.of());
            return false;
        }
        try {
            JsonNode root = mapper.readTree(body);
            String eventId = root.path("id").asText(null);
            String eventType = root.path("event").asText(null);
            if (eventId == null) return false;

            if (processed.existsByEventId(eventId)) {
                return true;  // idempotent — replay acknowledged
            }
            dispatch(root, eventType);
            processed.save(new ProcessedWebhookEvent(eventId, eventType));
            audit.logSystem("webhook.processed", "webhook", eventId, Map.of("type", String.valueOf(eventType)));
            return true;
        } catch (Exception e) {
            log.error("Webhook processing failed", e);
            return false;
        }
    }

    private void dispatch(JsonNode root, String eventType) {
        if (eventType == null) return;
        JsonNode entity = root.path("payload").path("payment").path("entity");
        String paymentId = entity.path("id").asText(null);
        String orderId = entity.path("order_id").asText(null);

        switch (eventType) {
            case "payment.captured" -> onPaymentCaptured(orderId, paymentId);
            case "payment.failed" -> onPaymentFailed(orderId);
            default -> log.debug("Unhandled Razorpay event {}", eventType);
        }
    }

    private void onPaymentCaptured(String orderId, String paymentId) {
        invoices.findByRazorpayOrderId(orderId).ifPresent(inv -> {
            if (inv.getStatus() == Invoice.Status.paid) return;      // already applied
            inv.setStatus(Invoice.Status.paid);
            inv.setRazorpayPaymentId(paymentId);
            inv.setPaidAt(java.time.Instant.now());
            invoices.save(inv);
            lifecycle.onPaymentReceived(inv.getTenant(), inv.getSubscription(), inv);
        });
    }

    private void onPaymentFailed(String orderId) {
        invoices.findByRazorpayOrderId(orderId).ifPresent(inv -> {
            Tenant t = inv.getTenant();
            mail_dunning(t);
        });
    }

    private void mail_dunning(Tenant t) {
        audit.logSystem("payment.failed", "tenant", t.getId().toString(), Map.of());
    }

    static String hmacSha256(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("HMAC failed", e);
        }
    }
}
