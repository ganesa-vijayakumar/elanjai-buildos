package com.elanjaibuildos.backend.controller;

import com.elanjaibuildos.backend.model.Brand;
import com.elanjaibuildos.backend.model.Material;
import com.elanjaibuildos.backend.model.PlanPackage;
import com.elanjaibuildos.backend.model.StageTemplate;
import com.elanjaibuildos.backend.repository.BrandRepository;
import com.elanjaibuildos.backend.repository.MaterialRepository;
import com.elanjaibuildos.backend.repository.PlanPackageRepository;
import com.elanjaibuildos.backend.repository.StageTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Tenant master data (SCR-032): brands, materials, packages, stage templates.
 * Read = any tenant user; write = OWNER/ADMIN.
 */
@RestController
@RequestMapping("/api/masters")
@RequiredArgsConstructor
public class MastersController {

    private final BrandRepository brands;
    private final MaterialRepository materials;
    private final PlanPackageRepository packages;
    private final StageTemplateRepository stageTemplates;

    // ---------- brands ----------
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','SITE_MANAGER')")
    @GetMapping("/brands")
    public List<Brand> brands() { return brands.findByIsActiveTrueOrderByNameAsc(); }

    @PostMapping("/brands")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public Brand createBrand(@RequestBody Brand b) { return brands.save(b); }

    @PutMapping("/brands/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public Brand updateBrand(@PathVariable UUID id, @RequestBody Brand b) {
        b.setId(id); return brands.save(b);
    }

    @DeleteMapping("/brands/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<Void> deleteBrand(@PathVariable UUID id) {
        brands.findById(id).ifPresent(b -> { b.setIsActive(false); brands.save(b); });
        return ResponseEntity.noContent().build();
    }

    // ---------- materials ----------
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','SITE_MANAGER')")
    @GetMapping("/materials")
    public List<Material> materials() { return materials.findByIsActiveTrueOrderByCategoryAscNameAsc(); }

    @PostMapping("/materials")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public Material createMaterial(@RequestBody Material m) { return materials.save(m); }

    @PutMapping("/materials/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public Material updateMaterial(@PathVariable UUID id, @RequestBody Material m) {
        m.setId(id); return materials.save(m);
    }

    @DeleteMapping("/materials/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<Void> deleteMaterial(@PathVariable UUID id) {
        materials.findById(id).ifPresent(m -> { m.setIsActive(false); materials.save(m); });
        return ResponseEntity.noContent().build();
    }

    // ---------- packages ----------
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','SITE_MANAGER')")
    @GetMapping("/packages")
    public List<PlanPackage> packages() { return packages.findByIsActiveTrueOrderByRatePerSqftAsc(); }

    @PostMapping("/packages")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public PlanPackage createPackage(@RequestBody PlanPackage p) { return packages.save(p); }

    @PutMapping("/packages/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public PlanPackage updatePackage(@PathVariable UUID id, @RequestBody PlanPackage p) {
        p.setId(id); return packages.save(p);
    }

    @DeleteMapping("/packages/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<Void> deletePackage(@PathVariable UUID id) {
        packages.findById(id).ifPresent(p -> { p.setIsActive(false); packages.save(p); });
        return ResponseEntity.noContent().build();
    }

    // ---------- stage templates ----------
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','SITE_MANAGER')")
    @GetMapping("/stage-templates")
    public List<StageTemplate> stageTemplates() { return stageTemplates.findAllByOrderByOrderIndexAsc(); }

    @PostMapping("/stage-templates")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public StageTemplate createStageTemplate(@RequestBody StageTemplate t) {
        t.setIsDefault(false); return stageTemplates.save(t);
    }

    @PutMapping("/stage-templates/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public StageTemplate updateStageTemplate(@PathVariable UUID id, @RequestBody StageTemplate t) {
        t.setId(id); return stageTemplates.save(t);
    }

    @DeleteMapping("/stage-templates/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<Void> deleteStageTemplate(@PathVariable UUID id) {
        stageTemplates.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
