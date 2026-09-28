package com.elanjaibuildos.backend.controller;

import com.elanjaibuildos.backend.service.LaborService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Labor module (F-046): workers, attendance, advances, wage summary. */
@RestController
@RequestMapping("/api/labor")
@RequiredArgsConstructor
public class LaborController {

    private final LaborService labor;

    // ---------- workers ----------
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','SITE_MANAGER')")
    @GetMapping("/sites/{siteId}/workers")
    public List<?> workers(@PathVariable UUID siteId,
                           @RequestParam(defaultValue = "true") boolean activeOnly) {
        return labor.listWorkers(siteId, activeOnly);
    }

    public record WorkerBody(String name, String phone, String type, BigDecimal dailyWage) {}

    @PostMapping("/sites/{siteId}/workers")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','SITE_MANAGER')")
    public ResponseEntity<?> addWorker(@PathVariable UUID siteId, @RequestBody WorkerBody b) {
        return ResponseEntity.ok(labor.addWorker(siteId, b.name(), b.phone(), b.type(), b.dailyWage()));
    }

    @PutMapping("/workers/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','SITE_MANAGER')")
    public ResponseEntity<?> updateWorker(@PathVariable UUID id, @RequestBody Map<String, Object> patch) {
        return ResponseEntity.ok(labor.updateWorker(id, patch));
    }

    // ---------- attendance ----------
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','SITE_MANAGER')")
    @GetMapping("/sites/{siteId}/attendance")
    public List<?> attendance(@PathVariable UUID siteId,
                              @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                              @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return labor.listSheets(siteId, from, to);
    }

    @PreAuthorize("hasAnyRole('OWNER','ADMIN','SITE_MANAGER')")
    @GetMapping("/attendance/{sheetId}/records")
    public List<?> sheetRows(@PathVariable UUID sheetId) {
        return labor.sheetRows(sheetId);
    }

    public record MarkBody(LocalDate date, List<Map<String, Object>> rows, String notes) {}

    @PostMapping("/sites/{siteId}/attendance")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','SITE_MANAGER')")
    public ResponseEntity<?> mark(@PathVariable UUID siteId, @RequestBody MarkBody b) {
        return ResponseEntity.ok(labor.mark(siteId, b.date(), b.rows(), b.notes()));
    }

    // ---------- advances ----------
    public record AdvanceBody(BigDecimal amount, LocalDate date, String reason) {}

    @PostMapping("/workers/{workerId}/advances")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','SITE_MANAGER')")
    public ResponseEntity<?> addAdvance(@PathVariable UUID workerId, @RequestBody AdvanceBody b) {
        return ResponseEntity.ok(labor.addAdvance(workerId, b.amount(), b.date(), b.reason()));
    }

    @PreAuthorize("hasAnyRole('OWNER','ADMIN','SITE_MANAGER')")
    @GetMapping("/workers/{workerId}/advances")
    public List<?> advances(@PathVariable UUID workerId) {
        return labor.advancesFor(workerId);
    }

    public record RecoverBody(BigDecimal amount) {}

    @PostMapping("/advances/{id}/recover")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','SITE_MANAGER')")
    public ResponseEntity<?> recover(@PathVariable UUID id, @RequestBody RecoverBody b) {
        return ResponseEntity.ok(labor.recover(id, b.amount()));
    }

    // ---------- wage summary ----------
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','SITE_MANAGER')")
    @GetMapping("/sites/{siteId}/wage-summary")
    public List<?> wageSummary(@PathVariable UUID siteId,
                               @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                               @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return labor.wageSummary(siteId, from, to);
    }
}
