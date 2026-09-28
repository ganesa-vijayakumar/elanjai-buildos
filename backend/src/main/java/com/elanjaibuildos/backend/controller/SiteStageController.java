package com.elanjaibuildos.backend.controller;

import com.elanjaibuildos.backend.model.SiteStage;
import com.elanjaibuildos.backend.model.StageTemplate;
import com.elanjaibuildos.backend.service.StageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Per-site editable construction stages (copied from stage_templates on site creation). */
@RestController
@RequestMapping("/api/sites/{siteId}/stages")
@RequiredArgsConstructor
public class SiteStageController {

    private final StageService stageService;

    @GetMapping
    public List<SiteStage> list(@PathVariable UUID siteId) {
        return stageService.forSite(siteId);
    }

    public record StageBody(String name, BigDecimal percentage, BigDecimal budgetAmount, String notes) {}

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public SiteStage add(@PathVariable UUID siteId, @RequestBody StageBody b) {
        return stageService.add(siteId, b.name(), b.percentage(), b.budgetAmount(), b.notes());
    }

    @PutMapping("/{stageId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'SITE_MANAGER')")
    public SiteStage update(@PathVariable UUID stageId, @RequestBody Map<String, Object> patch) {
        return stageService.update(stageId, patch);
    }

    @PostMapping("/reorder")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<Void> reorder(@PathVariable UUID siteId, @RequestBody List<UUID> orderedIds) {
        stageService.reorder(siteId, orderedIds);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{stageId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<Void> delete(@PathVariable UUID stageId) {
        stageService.delete(stageId);
        return ResponseEntity.noContent().build();
    }

    /** Tenant-level template view (for masters UI + preview). */
    @GetMapping("/template")
    public List<StageTemplate> template() {
        return stageService.template();
    }
}
