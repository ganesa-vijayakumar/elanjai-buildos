package com.elanjaibuildos.backend.controller;

import com.elanjaibuildos.backend.model.ProjectMaterial;
import com.elanjaibuildos.backend.model.Site;
import com.elanjaibuildos.backend.repository.BrandRepository;
import com.elanjaibuildos.backend.repository.ProjectMaterialRepository;
import com.elanjaibuildos.backend.repository.SiteRepository;
import com.elanjaibuildos.backend.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

/** Material tracking per site (F-048): specified → ordered → delivered → installed. */
@RestController
@RequestMapping("/api/sites/{siteId}/materials")
@RequiredArgsConstructor
public class ProjectMaterialController {

    private final ProjectMaterialRepository materials;
    private final SiteRepository sites;
    private final BrandRepository brands;
    private final UserRepository users;
    private final ObjectMapper om = new ObjectMapper();

    @GetMapping
    public List<ProjectMaterial> list(@PathVariable UUID siteId) {
        return materials.findBySiteIdOrderByCategoryAscMaterialNameAsc(siteId);
    }

    public record MaterialBody(String category, String materialName, String specifiedBrand,
                               UUID actualBrandId, BigDecimal estQuantity, BigDecimal actualQuantity,
                               String unit, String notes) {}

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','SITE_MANAGER')")
    public ResponseEntity<?> add(@PathVariable UUID siteId, @RequestBody MaterialBody b) {
        Site site = sites.findById(siteId).orElseThrow();
        ProjectMaterial m = ProjectMaterial.builder()
                .site(site).category(b.category()).materialName(b.materialName())
                .specifiedBrand(b.specifiedBrand())
                .estQuantity(b.estQuantity()).actualQuantity(b.actualQuantity())
                .unit(b.unit()).notes(b.notes())
                .status("pending").statusHistory(history("pending", null))
                .build();
        if (b.actualBrandId() != null) m.setActualBrand(brands.findById(b.actualBrandId()).orElse(null));
        return ResponseEntity.ok(materials.save(m));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','SITE_MANAGER')")
    public ResponseEntity<?> update(@PathVariable UUID siteId, @PathVariable UUID id,
                                    @RequestBody Map<String, Object> p) {
        ProjectMaterial m = materials.findById(id).orElseThrow();
        if (!m.getSite().getId().equals(siteId)) return ResponseEntity.notFound().build();
        if (p.containsKey("category")) m.setCategory((String) p.get("category"));
        if (p.containsKey("materialName")) m.setMaterialName((String) p.get("materialName"));
        if (p.containsKey("specifiedBrand")) m.setSpecifiedBrand((String) p.get("specifiedBrand"));
        if (p.containsKey("estQuantity")) m.setEstQuantity(new BigDecimal(p.get("estQuantity").toString()));
        if (p.containsKey("actualQuantity")) m.setActualQuantity(new BigDecimal(p.get("actualQuantity").toString()));
        if (p.containsKey("unit")) m.setUnit((String) p.get("unit"));
        if (p.containsKey("notes")) m.setNotes((String) p.get("notes"));
        if (p.containsKey("actualBrandId"))
            m.setActualBrand(p.get("actualBrandId") != null
                    ? brands.findById(UUID.fromString(p.get("actualBrandId").toString())).orElse(null) : null);

        if (p.containsKey("status")) {
            String next = (String) p.get("status");
            if (!Set.of("pending", "ordered", "delivered", "installed").contains(next))
                return ResponseEntity.badRequest().body(Map.of("error", "BAD_STATUS"));
            m.setStatus(next);
            m.setStatusHistory(history(next, m.getStatusHistory()));
        }
        return ResponseEntity.ok(materials.save(m));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID siteId, @PathVariable UUID id) {
        materials.findById(id).filter(m -> m.getSite().getId().equals(siteId))
                .ifPresent(materials::delete);
        return ResponseEntity.noContent().build();
    }

    private String history(String status, String existing) {
        try {
            List<Map<String, Object>> h = existing != null
                    ? om.readValue(existing, new com.fasterxml.jackson.core.type.TypeReference<>() {})
                    : new ArrayList<>();
            Map<String, Object> e = new LinkedHashMap<>();
            e.put("status", status);
            e.put("at", Instant.now().toString());
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null) users.findByEmail(auth.getName())
                    .ifPresent(u -> e.put("by", u.getFullName()));
            h.add(e);
            return om.writeValueAsString(h);
        } catch (Exception ex) {
            return "[]";
        }
    }
}
