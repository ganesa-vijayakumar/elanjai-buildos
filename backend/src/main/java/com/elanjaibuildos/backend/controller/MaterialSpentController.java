package com.elanjaibuildos.backend.controller;

import com.elanjaibuildos.backend.dto.MaterialSpentRequest;
import com.elanjaibuildos.backend.dto.MaterialSpentResponse;
import com.elanjaibuildos.backend.service.MaterialSpentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/material-spent")
@RequiredArgsConstructor
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
