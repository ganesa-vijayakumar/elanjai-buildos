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

    public TenantBillingController(TenantRepository tenants, PlanRepository plans,
                                   SubscriptionRepository subscriptions, InvoiceRepository invoices,
                                   UsageService usage, RazorpayService razorpay,
                                   InvoiceService invoiceService) {
        this.tenants = tenants; this.plans = plans; this.subscriptions = subscriptions;
        this.invoices = invoices; this.usage = usage; this.razorpay = razorpay;
        this.invoiceService = invoiceService;
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
        m.put("billingCycle", t.getBillingCycle());
        m.put("trialEndsAt", t.getTrialEndsAt());
        m.put("periodEnd", t.getCurrentPeriodEnd());
        m.put("usage", usage.snapshot(t));
        m.put("razorpayEnabled", razorpay.isEnabled());
        m.put("invoices", invoices.findByTenant_IdOrderByCreatedAtDesc(t.getId()).stream()
                .map(i -> Map.of("number", i.getInvoiceNumber(), "total", i.getTotalInr(),
                        "status", i.getStatus().name(),
                        "pdf", i.getPdfPath() != null))
                .toList());
        return m;
    }

    @GetMapping("/plans")
    public Object planCatalog() { return plans.findByIsActiveTrueOrderBySortOrder(); }

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
        });
        return ResponseEntity.ok(Map.of("status", "paid"));
    }
}
