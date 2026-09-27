package com.elanjaibuildos.backend.controller;

import com.elanjaibuildos.backend.dto.SiteRequest;
import com.elanjaibuildos.backend.dto.SiteResponse;
import com.elanjaibuildos.backend.service.SiteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/sites")
@RequiredArgsConstructor
public class SiteController {

    private final SiteService siteService;

    @GetMapping
    public ResponseEntity<List<SiteResponse>> getAllSites() {
        return ResponseEntity.ok(siteService.getMySites()); // Use getMySites to handle filtering
    }

    @GetMapping("/{id}")
    public ResponseEntity<SiteResponse> getSiteById(@PathVariable UUID id) {
        return ResponseEntity.ok(siteService.getSiteById(id));
    }

    @PostMapping
    public ResponseEntity<SiteResponse> createSite(@RequestBody SiteRequest request) {
        return ResponseEntity.ok(siteService.createSite(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SiteResponse> updateSite(@PathVariable UUID id, @RequestBody SiteRequest request) {
        return ResponseEntity.ok(siteService.updateSite(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSite(@PathVariable UUID id) {
        siteService.deleteSite(id);
        return ResponseEntity.noContent().build();
    }
}
