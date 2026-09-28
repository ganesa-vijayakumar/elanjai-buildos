package com.elanjaibuildos.backend.materials.web;

import com.elanjaibuildos.backend.materials.domain.MaterialCalculation;
import com.elanjaibuildos.backend.sites.domain.Site;
import com.elanjaibuildos.backend.identity.domain.User;
import com.elanjaibuildos.backend.materials.repository.MaterialCalculationRepository;
import com.elanjaibuildos.backend.sites.repository.SiteRepository;
import com.elanjaibuildos.backend.identity.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import com.elanjaibuildos.backend.materials.domain.Material;

/** Material estimator history (F-047): frontend computes, backend stores results. */
@RestController
@RequestMapping("/api/estimator")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('OWNER','ADMIN','SITE_MANAGER')")
public class EstimatorController {

    private final MaterialCalculationRepository calcs;
    private final SiteRepository sites;
    private final UserRepository users;
    private final ObjectMapper om = new ObjectMapper();

    @GetMapping("/sites/{siteId}/history")
    public List<MaterialCalculation> history(@PathVariable UUID siteId) {
        return calcs.findBySiteIdOrderByCalculatedAtDesc(siteId);
    }

    public record CalcBody(String taskType, Map<String, Object> dimensions,
                           Map<String, Object> results) {}

    @PostMapping("/sites/{siteId}/calculations")
    public ResponseEntity<?> save(@PathVariable UUID siteId, @RequestBody CalcBody b) {
        Site site = sites.findById(siteId).orElseThrow();
        try {
            MaterialCalculation c = MaterialCalculation.builder()
                    .site(site).taskType(b.taskType())
                    .dimensions(om.writeValueAsString(b.dimensions()))
                    .results(om.writeValueAsString(b.results()))
                    .calculatedBy(currentUser())
                    .build();
            return ResponseEntity.ok(calcs.save(c));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "BAD_PAYLOAD"));
        }
    }

    @DeleteMapping("/calculations/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        calcs.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private User currentUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) throw new RuntimeException("User not found in context");
        return users.findByEmail(auth.getName()).orElseThrow();
    }
}
