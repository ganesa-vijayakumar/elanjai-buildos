package com.elanjaibuildos.backend.platform.web;

import com.elanjaibuildos.backend.platform.domain.Invoice;
import com.elanjaibuildos.backend.platform.domain.Plan;
import com.elanjaibuildos.backend.platform.domain.SignupRequest;
import com.elanjaibuildos.backend.platform.domain.Tenant;
import com.elanjaibuildos.backend.platform.repository.*;
import com.elanjaibuildos.backend.platform.service.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.stream.Collectors;
import com.elanjaibuildos.backend.platform.domain.PlatformSetting;

/** Platform admin console APIs — tenants, approvals, plans, subscriptions, audit, settings. */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final TenantRepository tenants;
    private final SignupRequestRepository signups;
    private final PlanRepository plans;
    private final SubscriptionRepository subscriptions;
    private final InvoiceRepository invoices;
    private final PlatformAuditLogRepository auditRepo;
    private final PlatformSettingRepository settings;
    private final SignupService signupService;
    private final TenantLifecycleService lifecycle;
    private final UsageService usageService;
    private final ExportService exportService;

    @Value("${app.storage.root:./data/files}")
    private String storageRoot;

    public AdminController(TenantRepository tenants, SignupRequestRepository signups,
                           PlanRepository plans, SubscriptionRepository subscriptions,
                           InvoiceRepository invoices,
                           PlatformAuditLogRepository auditRepo, PlatformSettingRepository settings,
                           SignupService signupService, TenantLifecycleService lifecycle,
                           UsageService usageService, ExportService exportService) {
        this.tenants = tenants; this.signups = signups; this.plans = plans;
        this.subscriptions = subscriptions; this.invoices = invoices;
        this.auditRepo = auditRepo; this.settings = settings;
        this.signupService = signupService; this.lifecycle = lifecycle;
        this.usageService = usageService;
        this.exportService = exportService;
    }

    // ---------- Dashboard ----------
    @GetMapping("/dashboard")
    public Map<String, Object> dashboard() {
        List<Tenant> all = tenants.findAll();
        Map<String, Long> byStatus = all.stream().collect(
                Collectors.groupingBy(t -> t.getStatus().name(), Collectors.counting()));
        long mrr = all.stream()
                .filter(t -> t.getStatus() == Tenant.Status.ACTIVE)
                .filter(t -> t.getPlan() != null)
                .mapToLong(t -> "yearly".equals(t.getBillingCycle())
                        ? t.getPlan().getPriceYearlyInr() / 12 : t.getPlan().getPriceMonthlyInr())
                .sum();
        return Map.of(
                "tenantsByStatus", byStatus,
                "pendingApprovals", signups.findByStatus(SignupRequest.Status.PENDING).size(),
                "mrr", mrr,
                "activeTenants", byStatus.getOrDefault("ACTIVE", 0L),
                "trialTenants", byStatus.getOrDefault("TRIAL", 0L));
    }

    // ---------- Tenants ----------
    @GetMapping("/tenants")
    public List<Map<String, Object>> tenantList() {
        return tenants.findAll().stream().map(this::tenantView).collect(Collectors.toList());
    }

    @GetMapping("/tenants/{id}")
    public Map<String, Object> tenantDetail(@PathVariable UUID id) {
        Tenant t = tenants.findById(id).orElseThrow(() -> new NoSuchElementException("tenant"));
        Map<String, Object> m = new LinkedHashMap<>(tenantView(t));
        m.put("usage", usageService.snapshot(t));
        m.put("invoices", invoices.findByTenant_IdOrderByCreatedAtDesc(id).stream()
                .map(i -> Map.of("id", i.getId(), "number", i.getInvoiceNumber(), "total", i.getTotalInr(),
                        "status", i.getStatus().name(), "issuedAt", String.valueOf(i.getIssuedAt()),
                        "pdf", i.getPdfPath() != null))
                .toList());
        subscriptions.findTopByTenant_IdOrderByCreatedAtDesc(id).ifPresent(s ->
                m.put("subscription", Map.of("status", s.getStatus().name(),
                        "periodEnd", String.valueOf(s.getCurrentPeriodEnd()))));
        return m;
    }

    public record StatusBody(String reason) {}

    @PostMapping("/tenants/{id}/suspend")
    public Map<String, String> suspend(@PathVariable UUID id, @RequestBody(required = false) StatusBody b,
                                       Authentication auth) {
        Tenant t = tenants.findById(id).orElseThrow();
        lifecycle.suspend(t, actorId(auth), b != null ? b.reason() : "manual suspend");
        return Map.of("status", t.getStatus().name());
    }

    @PostMapping("/tenants/{id}/reactivate")
    public Map<String, String> reactivate(@PathVariable UUID id, Authentication auth) {
        Tenant t = tenants.findById(id).orElseThrow();
        lifecycle.reactivate(t, actorId(auth));
        return Map.of("status", t.getStatus().name());
    }

    @PostMapping("/tenants/{id}/cancel")
    public Map<String, String> cancel(@PathVariable UUID id, Authentication auth) {
        Tenant t = tenants.findById(id).orElseThrow();
        lifecycle.cancel(t, actorId(auth));
        return Map.of("status", t.getStatus().name());
    }

    @PostMapping("/tenants/{id}/offboard")
    public ResponseEntity<?> offboard(@PathVariable UUID id, Authentication auth) throws Exception {
        Tenant t = tenants.findById(id).orElseThrow();
        exportService.exportTenant(t);                      // F-016: CSV ZIP before offboard
        lifecycle.offboard(t, actorId(auth));
        return ResponseEntity.ok(Map.of("status", t.getStatus().name()));
    }

    /** Download the CSV export ZIP produced at offboard time (REQ-016). */
    @GetMapping("/tenants/{id}/export")
    public ResponseEntity<Resource> downloadExport(@PathVariable UUID id) {
        Tenant t = tenants.findById(id).orElseThrow(() -> new NoSuchElementException("tenant"));
        Path zip = safeResolve("exports", t.getSlug() + ".zip");
        if (!Files.isRegularFile(zip)) throw new NoSuchElementException("export not found — tenant may not be offboarded yet");
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + zip.getFileName() + "\"")
                .contentType(MediaType.parseMediaType("application/zip"))
                .body(new FileSystemResource(zip));
    }

    /** Download a GST invoice PDF (platform-side copy). */
    @GetMapping("/invoices/{id}/pdf")
    public ResponseEntity<Resource> downloadInvoicePdf(@PathVariable UUID id) {
        Invoice inv = invoices.findById(id).orElseThrow(() -> new NoSuchElementException("invoice"));
        if (inv.getPdfPath() == null || !inv.getPdfPath().startsWith("public/invoices/"))
            throw new NoSuchElementException("invoice pdf");
        Path pdf = safeResolve("invoices", Path.of(inv.getPdfPath()).getFileName().toString());
        if (!Files.isRegularFile(pdf)) throw new NoSuchElementException("invoice pdf file");
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + pdf.getFileName() + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(new FileSystemResource(pdf));
    }

    /** Resolve <storage>/public/<dir>/<name> and refuse anything escaping that dir. */
    private Path safeResolve(String dir, String name) {
        Path base = Path.of(storageRoot, "public", dir).toAbsolutePath().normalize();
        Path p = base.resolve(name).normalize();
        if (!p.startsWith(base)) throw new IllegalArgumentException("bad path");
        return p;
    }

    @PostMapping("/tenants/{id}/retry-provisioning")
    public Map<String, String> retryProvision(@PathVariable UUID id, Authentication auth) {
        Tenant t = tenants.findById(id).orElseThrow();
        signupService.resumeProvisioning(t, actorId(auth));
        return Map.of("status", t.getStatus().name());
    }

    // ---------- Approvals ----------
    @GetMapping("/approvals")
    public List<Map<String, Object>> pendingApprovals() {
        return signups.findByStatus(SignupRequest.Status.PENDING).stream()
                .map(r -> {
                    Map<String, Object> m = new LinkedHashMap<String, Object>();
                    m.put("id", r.getId()); m.put("company", r.getCompanyName());
                    m.put("owner", r.getOwnerName()); m.put("email", r.getEmail());
                    m.put("slug", r.getSlug()); m.put("plan", r.getPlan() != null ? r.getPlan().getCode() : null);
                    m.put("billingCycle", r.getBillingCycle());
                    m.put("emailVerified", r.getEmailVerified());
                    m.put("createdAt", r.getCreatedAt());
                    return m;
                }).toList();
    }

    @PostMapping("/approvals/{id}/approve")
    public ResponseEntity<?> approve(@PathVariable UUID id, Authentication auth) {
        try {
            Tenant t = signupService.approve(id, actorId(auth));
            return ResponseEntity.ok(Map.of("tenantId", t.getId(), "status", t.getStatus().name()));
        } catch (SignupService.SignupException e) {
            return ResponseEntity.unprocessableEntity()
                    .body(Map.of("error", "PROVISION_FAILED", "message", e.getMessage()));
        }
    }

    public record RejectBody(String reason) {}

    @PostMapping("/approvals/{id}/reject")
    public Map<String, String> reject(@PathVariable UUID id, @RequestBody RejectBody b, Authentication auth) {
        signupService.reject(id, actorId(auth), b.reason());
        return Map.of("status", "rejected");
    }

    // ---------- Plans ----------
    @GetMapping("/plans")
    public List<Plan> allPlans() { return plans.findAll(); }

    @PutMapping("/plans/{id}")
    public Plan updatePlan(@PathVariable UUID id, @RequestBody Plan body) {
        Plan p = plans.findById(id).orElseThrow();
        p.setName(body.getName());
        p.setPriceMonthlyInr(body.getPriceMonthlyInr());
        p.setPriceYearlyInr(body.getPriceYearlyInr());
        p.setMaxProjects(body.getMaxProjects());
        p.setMaxStaffUsers(body.getMaxStaffUsers());
        p.setMaxQuotationsPerMonth(body.getMaxQuotationsPerMonth());
        p.setStorageGb(body.getStorageGb());
        p.setFeatureFlags(body.getFeatureFlags());
        p.setIsActive(body.getIsActive());
        p.setSortOrder(body.getSortOrder());
        return plans.save(p);
    }

    // ---------- Subscriptions & invoices ----------
    @GetMapping("/subscriptions")
    public List<Map<String, Object>> subscriptionList() {
        return subscriptions.findAll().stream().map(s -> {
            Map<String, Object> m = new LinkedHashMap<String, Object>();
            m.put("id", s.getId()); m.put("tenant", s.getTenant().getSlug());
            m.put("plan", s.getPlan().getCode()); m.put("status", s.getStatus().name());
            m.put("cycle", s.getBillingCycle()); m.put("periodEnd", s.getCurrentPeriodEnd());
            return m;
        }).toList();
    }

    @GetMapping("/invoices")
    public List<Map<String, Object>> invoiceList() {
        return invoices.findAll().stream().map(i -> {
            Map<String, Object> m = new LinkedHashMap<String, Object>();
            m.put("id", i.getId()); m.put("number", i.getInvoiceNumber());
            m.put("tenant", i.getTenant().getSlug()); m.put("total", i.getTotalInr());
            m.put("status", i.getStatus().name()); m.put("issuedAt", i.getIssuedAt());
            return m;
        }).toList();
    }

    // ---------- Audit & settings ----------
    @GetMapping("/audit")
    public List<?> audit(@RequestParam(required = false) String entityType,
                         @RequestParam(required = false) String entityId) {
        if (entityType != null && entityId != null) {
            return auditRepo.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId);
        }
        return auditRepo.findTop200ByOrderByCreatedAtDesc();
    }

    @GetMapping("/settings")
    public Map<String, String> settings() {
        return settings.findAll().stream().collect(
                Collectors.toMap(s -> s.getKey(), s -> s.getValue() == null ? "" : s.getValue()));
    }

    @PutMapping("/settings")
    public Map<String, String> putSettings(@RequestBody Map<String, String> body) {
        body.forEach((k, v) -> {
            var s = settings.findById(k).orElseGet(() -> {
                var n = new com.elanjaibuildos.backend.platform.domain.PlatformSetting();
                n.setKey(k); return n;
            });
            s.setValue(v); settings.save(s);
        });
        return settings();
    }

    // ---------- helpers ----------
    private Map<String, Object> tenantView(Tenant t) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", t.getId()); m.put("company", t.getCompanyName());
        m.put("slug", t.getSlug()); m.put("owner", t.getOwnerName());
        m.put("email", t.getOwnerEmail()); m.put("status", t.getStatus().name());
        m.put("plan", t.getPlan() != null ? t.getPlan().getCode() : null);
        m.put("billingCycle", t.getBillingCycle());
        m.put("trialEndsAt", t.getTrialEndsAt());
        m.put("periodEnd", t.getCurrentPeriodEnd());
        m.put("createdAt", t.getCreatedAt());
        return m;
    }

    private UUID actorId(Authentication auth) {
        if (auth != null && auth.getDetails() instanceof Map<?, ?> d && d.get("userId") != null) {
            return UUID.fromString(d.get("userId").toString());
        }
        return null;
    }
}
