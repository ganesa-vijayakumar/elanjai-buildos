package com.elanjaibuildos.backend.platform.web;

import com.elanjaibuildos.backend.platform.domain.Tenant;
import com.elanjaibuildos.backend.platform.repository.InvoiceRepository;
import com.elanjaibuildos.backend.platform.repository.PlanRepository;
import com.elanjaibuildos.backend.platform.repository.PlatformAuditLogRepository;
import com.elanjaibuildos.backend.platform.repository.SubscriptionRepository;
import com.elanjaibuildos.backend.platform.repository.TenantRepository;
import com.elanjaibuildos.backend.platform.service.UsageService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;
import com.elanjaibuildos.backend.platform.domain.Invoice;

/**
 * Read-only support views (REQ-037). Mounted at /api/platform/** which the
 * security config already restricts to PLATFORM_ADMIN + PLATFORM_SUPPORT.
 * No mutating endpoints here on purpose.
 */
@RestController
@RequestMapping("/api/platform")
@RequiredArgsConstructor
public class PlatformSupportController {

    private final TenantRepository tenants;
    private final SubscriptionRepository subscriptions;
    private final InvoiceRepository invoices;
    private final PlatformAuditLogRepository auditRepo;
    private final PlanRepository plans;
    private final UsageService usageService;

    @Value("${app.storage.root:./data/files}")
    private String storageRoot;

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard() {
        Map<String, Long> byStatus = tenants.findAll().stream()
                .collect(Collectors.groupingBy(t -> t.getStatus().name(), Collectors.counting()));
        return Map.of("totalTenants", tenants.count(),
                "activeTenants", byStatus.getOrDefault("ACTIVE", 0L),
                "trialTenants", byStatus.getOrDefault("TRIAL", 0L),
                "suspendedTenants", byStatus.getOrDefault("SUSPENDED", 0L));
    }

    @GetMapping("/tenants")
    public List<Map<String, Object>> tenantList() {
        return tenants.findAll().stream().map(this::tenantView).toList();
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

    /** Invoice PDF download — read-only support surface. */
    @GetMapping("/invoices/{id}/pdf")
    public org.springframework.http.ResponseEntity<org.springframework.core.io.Resource> invoicePdf(
            @PathVariable UUID id) {
        var inv = invoices.findById(id).orElseThrow(() -> new NoSuchElementException("invoice"));
        if (inv.getPdfPath() == null || !inv.getPdfPath().startsWith("public/invoices/"))
            throw new NoSuchElementException("invoice pdf");
        java.nio.file.Path base = java.nio.file.Path.of(storageRoot, "public", "invoices")
                .toAbsolutePath().normalize();
        java.nio.file.Path pdf = base.resolve(java.nio.file.Path.of(inv.getPdfPath()).getFileName().toString())
                .normalize();
        if (!pdf.startsWith(base) || !java.nio.file.Files.isRegularFile(pdf))
            throw new NoSuchElementException("invoice pdf file");
        return org.springframework.http.ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + pdf.getFileName() + "\"")
                .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                .body(new org.springframework.core.io.FileSystemResource(pdf));
    }

    @GetMapping("/plans")
    public List<?> planList() {
        return plans.findAll();
    }

    @GetMapping("/audit")
    public List<?> audit(@RequestParam(required = false) String entityType,
                         @RequestParam(required = false) String entityId) {
        if (entityType != null && entityId != null) {
            return auditRepo.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId);
        }
        return auditRepo.findTop200ByOrderByCreatedAtDesc();
    }

    private Map<String, Object> tenantView(Tenant t) {
        Map<String, Object> m = new LinkedHashMap<String, Object>();
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
}
