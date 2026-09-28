package com.elanjaibuildos.backend.platform.controller;

import com.elanjaibuildos.backend.common.multitenancy.TenantContext;
import com.elanjaibuildos.backend.platform.model.Invoice;
import com.elanjaibuildos.backend.platform.model.Plan;
import com.elanjaibuildos.backend.platform.model.Subscription;
import com.elanjaibuildos.backend.platform.model.Tenant;
import com.elanjaibuildos.backend.platform.repository.*;
import com.elanjaibuildos.backend.platform.service.InvoiceService;
import com.elanjaibuildos.backend.platform.service.RazorpayService;
import com.elanjaibuildos.backend.platform.service.UsageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/** Tenant-facing billing page API (OWNER only). Resolves tenant via TenantContext slug. */
@RestController
@RequestMapping("/api/billing")
@PreAuthorize("hasRole('OWNER')")
public class TenantBillingController {

    private final TenantRepository tenants;
    private final PlanRepository plans;
    private final SubscriptionRepository subscriptions;
    private final InvoiceRepository invoices;
    private final UsageService usage;
    private final RazorpayService razorpay;
    private final InvoiceService invoiceService;
    private final com.elanjaibuildos.backend.platform.service.TenantLifecycleService lifecycle;

    @Value("${app.storage.root:./data/files}")
    private String storageRoot;

    public TenantBillingController(TenantRepository tenants, PlanRepository plans,
                                   SubscriptionRepository subscriptions, InvoiceRepository invoices,
                                   UsageService usage, RazorpayService razorpay,
                                   InvoiceService invoiceService,
                                   com.elanjaibuildos.backend.platform.service.TenantLifecycleService lifecycle) {
        this.tenants = tenants; this.plans = plans; this.subscriptions = subscriptions;
        this.invoices = invoices; this.usage = usage; this.razorpay = razorpay;
        this.invoiceService = invoiceService; this.lifecycle = lifecycle;
    }

    private Tenant current() {
        return tenants.findBySlug(TenantContext.getSlug()).orElseThrow();
    }

    @GetMapping
    public Map<String, Object> overview() {
        Tenant t = current();
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("status", t.getStatus().name());
        m.put("plan", t.getPlan() != null ? t.getPlan().getCode() : null);
        m.put("planName", t.getPlan() != null ? t.getPlan().getName() : null);
        Subscription sub = subscriptions.findByTenant_Id(t.getId()).orElse(null);
        m.put("scheduledPlan", sub != null && sub.getScheduledPlan() != null
                ? Map.of("code", sub.getScheduledPlan().getCode(), "name", sub.getScheduledPlan().getName())
                : null);
        m.put("billingCycle", t.getBillingCycle());
        m.put("trialEndsAt", t.getTrialEndsAt());
        m.put("periodEnd", t.getCurrentPeriodEnd());
        m.put("usage", usage.snapshot(t));
        m.put("razorpayEnabled", razorpay.isEnabled());
        m.put("invoices", invoices.findByTenant_IdOrderByCreatedAtDesc(t.getId()).stream()
                .map(i -> Map.of("id", i.getId(), "number", i.getInvoiceNumber(), "total", i.getTotalInr(),
                        "status", i.getStatus().name(),
                        "pdf", i.getPdfPath() != null))
                .toList());
        return m;
    }

    @GetMapping("/plans")
    public Object planCatalog() { return plans.findByIsActiveTrueOrderBySortOrder(); }

    /** Download the GST invoice PDF — strictly scoped to the caller's own tenant. */
    @GetMapping("/invoices/{id}/pdf")
    public ResponseEntity<org.springframework.core.io.Resource> invoicePdf(@PathVariable java.util.UUID id) {
        Tenant t = current();
        Invoice inv = invoices.findById(id).orElseThrow(() -> new java.util.NoSuchElementException("invoice"));
        if (!inv.getTenant().getId().equals(t.getId()))
            throw new java.util.NoSuchElementException("invoice"); // other tenant's invoice → 404, not 403
        if (inv.getPdfPath() == null || !inv.getPdfPath().startsWith("public/invoices/"))
            throw new java.util.NoSuchElementException("invoice pdf");
        java.nio.file.Path base = java.nio.file.Path.of(storageRoot, "public", "invoices")
                .toAbsolutePath().normalize();
        java.nio.file.Path pdf = base.resolve(java.nio.file.Path.of(inv.getPdfPath()).getFileName().toString())
                .normalize();
        if (!pdf.startsWith(base) || !java.nio.file.Files.isRegularFile(pdf))
            throw new java.util.NoSuchElementException("invoice pdf file");
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + pdf.getFileName() + "\"")
                .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                .body(new org.springframework.core.io.FileSystemResource(pdf));
    }

    public record CheckoutBody(String planCode, String billingCycle) {}

    /** Create Razorpay order + issued invoice for the chosen plan. */
    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(@RequestBody CheckoutBody b) {
        Tenant t = current();
        Plan plan = plans.findByCode(b.planCode()).orElseThrow();
        String cycle = "yearly".equalsIgnoreCase(b.billingCycle()) ? "yearly" : "monthly";
        Invoice inv = invoiceService.issue(t, plan, cycle);

        if (!razorpay.isEnabled()) {
            // Razorpay not configured → invoice issued; payment must happen out-of-band.
            return ResponseEntity.ok(Map.of(
                    "invoiceId", inv.getId(), "invoiceNumber", inv.getInvoiceNumber(),
                    "total", inv.getTotalInr(), "razorpayEnabled", false,
                    "message", "Invoice issued — contact support to complete payment."));
        }
        var order = razorpay.createOrder(t, inv.getTotalInr().longValue());
        inv.setRazorpayOrderId(String.valueOf(order.get("orderId")));
        invoices.save(inv);
        return ResponseEntity.ok(Map.of(
                "invoiceId", inv.getId(), "invoiceNumber", inv.getInvoiceNumber(),
                "total", inv.getTotalInr(), "razorpayEnabled", true,
                "orderId", order.get("orderId"), "keyId", order.get("keyId"),
                "amount", order.get("amount"), "currency", order.get("currency")));
    }

    public record VerifyBody(String orderId, String paymentId, String signature) {}

    /** Checkout.js callback — verify signature, mark invoice paid, activate tenant. */
    @PostMapping("/verify")
    public ResponseEntity<?> verify(@RequestBody VerifyBody b) {
        if (!razorpay.verifyPaymentSignature(b.orderId(), b.paymentId(), b.signature())) {
            return ResponseEntity.status(400)
                    .body(Map.of("error", "BAD_SIGNATURE", "message", "Payment signature verification failed."));
        }
        Tenant t = current();
        invoices.findByRazorpayOrderId(b.orderId()).ifPresent(inv -> {
            inv.setRazorpayPaymentId(b.paymentId());
            inv.setStatus(Invoice.Status.paid);
            inv.setPaidAt(java.time.Instant.now());
            invoices.save(inv);
            // Apply activation/plan synchronously — the webhook may never reach localhost (D-051)
            lifecycle.onPaymentReceived(t, inv.getSubscription(), inv);
        });
        return ResponseEntity.ok(Map.of("status", "paid"));
    }

    public record ChangePlanBody(String planCode) {}

    /** Plan change (REQ-015/D-051): upgrade → checkout now; downgrade → scheduled at renewal. */
    @PostMapping("/change-plan")
    public ResponseEntity<?> changePlan(@RequestBody ChangePlanBody b) {
        Tenant t = current();
        Plan next = plans.findByCode(b.planCode()).orElseThrow();
        Plan cur = t.getPlan();
        if (cur != null && cur.getId().equals(next.getId())) {
            return ResponseEntity.ok(Map.of("kind", "noop", "message", "Already on this plan."));
        }
        long curPrice = cur != null && cur.getPriceMonthlyInr() != null ? cur.getPriceMonthlyInr() : 0;
        long nextPrice = next.getPriceMonthlyInr() != null ? next.getPriceMonthlyInr() : 0;
        if (nextPrice > curPrice) {
            // Upgrade → pay now via /billing/checkout; applies immediately on verify/webhook
            return ResponseEntity.ok(Map.of("kind", "checkout",
                    "planCode", next.getCode(), "planName", next.getName(),
                    "message", "Upgrade — complete checkout to switch immediately."));
        }
        // Downgrade (or free switch) → schedule at renewal
        Subscription sub = subscriptions.findByTenant_Id(t.getId())
                .orElseThrow(() -> new IllegalStateException("No active subscription"));
        sub.setScheduledPlan(next);
        subscriptions.save(sub);
        return ResponseEntity.ok(Map.of("kind", "scheduled",
                "planCode", next.getCode(), "planName", next.getName(),
                "effectiveAt", sub.getCurrentPeriodEnd(),
                "message", "Downgrade scheduled — takes effect at your next renewal."));
    }

    /** Cancel a scheduled downgrade. */
    @PostMapping("/cancel-scheduled")
    public ResponseEntity<?> cancelScheduled() {
        Tenant t = current();
        Subscription sub = subscriptions.findByTenant_Id(t.getId()).orElseThrow();
        sub.setScheduledPlan(null);
        subscriptions.save(sub);
        return ResponseEntity.ok(Map.of("kind", "cancelled"));
    }
}
