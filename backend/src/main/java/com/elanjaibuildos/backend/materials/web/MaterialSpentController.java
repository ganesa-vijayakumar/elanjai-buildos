package com.elanjaibuildos.backend.materials.web;

import com.elanjaibuildos.backend.materials.api.MaterialSpentRequest;
import com.elanjaibuildos.backend.materials.api.MaterialSpentResponse;
import com.elanjaibuildos.backend.materials.service.MaterialSpentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/material-spent")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('OWNER','ADMIN','SITE_MANAGER')")
public class MaterialSpentController {

    private final MaterialSpentService materialSpentService;

    @GetMapping
    public ResponseEntity<List<MaterialSpentResponse>> getAllMaterialSpent() {
        return ResponseEntity.ok(materialSpentService.getAllMaterialSpent());
    }

    @PostMapping
    public ResponseEntity<MaterialSpentResponse> createOrUpdateMaterialSpent(
            @RequestBody MaterialSpentRequest request) {
        return ResponseEntity.ok(materialSpentService.createOrUpdateMaterialSpent(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMaterialSpent(@PathVariable UUID id) {
        materialSpentService.deleteMaterialSpent(id);
        return ResponseEntity.noContent().build();
    }
}
