package com.elanjaibuildos.backend.platform.service;

import com.elanjaibuildos.backend.common.multitenancy.TenantSchemaProvisioner;
import com.elanjaibuildos.backend.platform.domain.Invoice;
import com.elanjaibuildos.backend.platform.domain.Subscription;
import com.elanjaibuildos.backend.platform.domain.Tenant;
import com.elanjaibuildos.backend.platform.repository.InvoiceRepository;
import com.elanjaibuildos.backend.platform.repository.SubscriptionRepository;
import com.elanjaibuildos.backend.platform.repository.TenantRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;

/**
 * Lifecycle engine (BR-005..009):
 *   TRIAL (14d) → GRACE (7d, read-only) → SUSPENDED
 *   ACTIVE → GRACE (7d on unpaid renewal) → SUSPENDED
 *   suspend → reactivate (payment or manual) → CANCELLED → OFFBOARDED
 * Renewal reminders at D-7 / D-3 / D-1 (emails via notification queue).
 */
@Service
public class TenantLifecycleService {

    private static final Logger log = LoggerFactory.getLogger(TenantLifecycleService.class);

    private final TenantRepository tenants;
    private final SubscriptionRepository subscriptions;
    private final InvoiceRepository invoices;
    private final PlatformMailService mail;
    private final AuditService audit;
    private final TenantSchemaProvisioner provisioner;

    @Value("${app.tenancy.grace-days:7}")
    private int graceDays;

    @Value("${app.tenancy.retention-days:30}")
    private int retentionDays;

    public TenantLifecycleService(TenantRepository tenants, SubscriptionRepository subscriptions,
                                  InvoiceRepository invoices, PlatformMailService mail,
                                  AuditService audit, TenantSchemaProvisioner provisioner) {
        this.tenants = tenants; this.subscriptions = subscriptions; this.invoices = invoices;
        this.mail = mail; this.audit = audit; this.provisioner = provisioner;
    }

    /** Hourly sweep: expiring trials/overdue periods → GRACE; expired grace → SUSPENDED. */
    @Scheduled(fixedDelayString = "${app.lifecycle.sweep-ms:3600000}")
    @Transactional
    public void sweep() {
        Instant now = Instant.now();
        for (Tenant t : tenants.findByStatus(Tenant.Status.TRIAL)) {
            if (t.getTrialEndsAt() != null && t.getTrialEndsAt().isBefore(now)) {
                transition(t, Tenant.Status.GRACE, "trial expired — grace started");
            } else {
                remindTrialEnding(t, now);
            }
        }
        for (Tenant t : tenants.findByStatus(Tenant.Status.ACTIVE)) {
            if (t.getCurrentPeriodEnd() != null && t.getCurrentPeriodEnd().isBefore(now)) {
                transition(t, Tenant.Status.GRACE, "period end passed without renewal payment");
            } else {
                remindRenewal(t, now);
            }
        }
        for (Tenant t : tenants.findByStatus(Tenant.Status.GRACE)) {
            Instant graceEnd = graceEndOf(t);
            if (graceEnd != null && graceEnd.isBefore(now)) {
                transition(t, Tenant.Status.SUSPENDED, "grace period elapsed");
            }
        }
        purgeExpiredOffboards(now);
    }

    /** Retention: OFFBOARDED tenants keep their schema for retention-days, then it is dropped. */
    private void purgeExpiredOffboards(Instant now) {
        for (Tenant t : tenants.findByStatus(Tenant.Status.OFFBOARDED)) {
            if (t.getOffboardedAt() == null
                    || !t.getOffboardedAt().plus(retentionDays, ChronoUnit.DAYS).isBefore(now)) continue;
            String schema = TenantSchemaProvisioner.schemaFor(t.getSlug());
            if (!provisioner.schemaExists(schema)) continue; // already purged — keep sweep idempotent
            try {
                provisioner.drop(t.getSlug());
                audit.logSystem("tenant.purged", "tenant", t.getId().toString(),
                        Map.of("schema", schema, "retentionDays", retentionDays));
                log.info("Purged tenant schema {} after {}d retention", schema, retentionDays);
            } catch (Exception e) {
                log.error("Tenant schema purge failed for {}", schema, e);
            }
        }
    }

    /** Payment confirmed → activate/renew tenant. Called by webhook + manual paths. */
    @Transactional
    public void onPaymentReceived(Tenant tenant, Subscription sub, Invoice invoice) {
        Instant newPeriodEnd = computePeriodEnd(tenant.getBillingCycle());
        tenant.setStatus(Tenant.Status.ACTIVE);
        tenant.setCurrentPeriodEnd(newPeriodEnd);
        tenants.save(tenant);

        if (sub != null) {
            sub.setStatus(Subscription.Status.ACTIVE);
            sub.setCurrentPeriodStart(Instant.now());
            sub.setCurrentPeriodEnd(newPeriodEnd);
            if (invoice != null && invoice.getPlan() != null) {
                // plan bought by this invoice applies immediately (D-051 upgrades)
                sub.setPlan(invoice.getPlan());
                sub.setScheduledPlan(null);
                tenant.setPlan(invoice.getPlan());
                tenants.save(tenant);
            } else if (sub.getScheduledPlan() != null) {
                // apply scheduled downgrade at renewal (D-051)
                sub.setPlan(sub.getScheduledPlan());
                sub.setScheduledPlan(null);
                tenant.setPlan(sub.getPlan());
                tenants.save(tenant);
            }
            subscriptions.save(sub);
        }
        audit.logSystem("tenant.activated", "tenant", tenant.getId().toString(),
                Map.of("invoice", invoice != null ? invoice.getInvoiceNumber() : "manual"));
    }

    @Transactional
    public void suspend(Tenant t, UUID adminId, String reason) {
        transition(t, Tenant.Status.SUSPENDED, reason);
    }

    @Transactional
    public void reactivate(Tenant t, UUID adminId) {
        if (t.getCurrentPeriodEnd() == null || t.getCurrentPeriodEnd().isBefore(Instant.now())) {
            t.setCurrentPeriodEnd(Instant.now().plus(graceDays, ChronoUnit.DAYS));
        }
        transition(t, Tenant.Status.ACTIVE, "reactivated");
    }

    @Transactional
    public void cancel(Tenant t, UUID adminId) {
        t.setCancelledAt(Instant.now());
        transition(t, Tenant.Status.CANCELLED, "cancelled");
        mail.queueEmail(t.getId(), "cancelled", t.getOwnerEmail(),
                "Workspace cancelled", "Your workspace " + t.getSlug() + " has been cancelled.");
    }

    /** Offboard: export happens in ExportService; mark + schedule deletion. */
    @Transactional
    public void offboard(Tenant t, UUID adminId) {
        t.setOffboardedAt(Instant.now());
        transition(t, Tenant.Status.OFFBOARDED, "offboarded — data retained 30d then purged");
    }

    @Transactional
    public void retryProvisioning(Tenant t) {
        if (t.getStatus() != Tenant.Status.PROVISION_FAILED) return;
        t.setStatus(Tenant.Status.PROVISIONING);
        tenants.save(t);
        try {
            provisioner.provision(t.getSlug());
            t.setStatus(Tenant.Status.TRIAL);
            t.setTrialEndsAt(Instant.now().plus(14, ChronoUnit.DAYS));
            t.setCurrentPeriodEnd(t.getTrialEndsAt());
            tenants.save(t);
        } catch (Exception e) {
            t.setStatus(Tenant.Status.PROVISION_FAILED);
            tenants.save(t);
            throw e;
        }
    }

    private void transition(Tenant t, Tenant.Status to, String reason) {
        Tenant.Status from = t.getStatus();
        t.setStatus(to);
        if (to == Tenant.Status.SUSPENDED) t.setSuspendedAt(Instant.now());
        tenants.save(t);
        audit.logSystem("tenant.status_changed", "tenant", t.getId().toString(),
                Map.of("from", from.name(), "to", to.name(), "reason", reason));
        switch (to) {
            case GRACE -> mail.queueEmail(t.getId(), "payment_failed", t.getOwnerEmail(),
                    "Payment due — workspace in grace period",
                    "Your workspace " + t.getSlug() + " is now in a " + graceDays
                            + "-day grace period (read-only). Pay the outstanding invoice to restore access.");
            case SUSPENDED -> mail.queueEmail(t.getId(), "suspended", t.getOwnerEmail(),
                    "Workspace suspended",
                    "Your workspace " + t.getSlug() + " has been suspended. Contact support or pay the outstanding invoice.");
            default -> { }
        }
    }

    private Instant graceEndOf(Tenant t) {
        Instant base = t.getSuspendedAt() != null ? t.getSuspendedAt()
                : (t.getTrialEndsAt() != null && t.getTrialEndsAt().isBefore(Instant.now()) ? t.getTrialEndsAt()
                   : t.getCurrentPeriodEnd());
        return base == null ? null : base.plus(graceDays, ChronoUnit.DAYS);
    }

    private void remindTrialEnding(Tenant t, Instant now) {
        if (t.getTrialEndsAt() == null) return;
        remindAt(t, t.getTrialEndsAt(), now, "trial_ending",
                "Your trial ends soon", "Trial for " + t.getSlug() + " ends ");
    }

    private void remindRenewal(Tenant t, Instant now) {
        if (t.getCurrentPeriodEnd() == null) return;
        remindAt(t, t.getCurrentPeriodEnd(), now, "renewal_due",
                "Subscription renewal due", "Your subscription renews on ");
    }

    /** D-7 / D-3 / D-1 reminders — deduped via audit log marker. */
    private void remindAt(Tenant t, Instant end, Instant now, String type, String subject, String body) {
        long daysLeft = ChronoUnit.DAYS.between(now, end);
        if (daysLeft == 7 || daysLeft == 3 || daysLeft == 1) {
            String marker = type + ":" + daysLeft + ":" + end.toString().substring(0, 10);
            boolean sent = audit != null && auditHasMarker(t.getId(), marker);
            if (!sent) {
                mail.queueEmail(t.getId(), type, t.getOwnerEmail(), subject,
                        body + end.toString().substring(0, 10) + ". Renew to keep full access.");
                audit.logSystem(type + ".reminded", "tenant", t.getId().toString(),
                        Map.of("marker", marker));
            }
        }
    }

    private boolean auditHasMarker(UUID tenantId, String marker) {
        // cheap dedupe: scan last audit entries for this tenant
        return false; // TODO(phase-verify): add findByEntityIdAndActionContains query for precise dedupe
    }

    private Instant computePeriodEnd(String cycle) {
        return "yearly".equals(cycle)
                ? Instant.now().plus(365, ChronoUnit.DAYS)
                : Instant.now().plus(30, ChronoUnit.DAYS);
    }
}
