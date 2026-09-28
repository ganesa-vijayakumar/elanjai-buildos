package com.elanjaibuildos.backend.controller;

import com.elanjaibuildos.backend.dto.CollectionRequest;
import com.elanjaibuildos.backend.dto.CollectionResponse;
import com.elanjaibuildos.backend.service.CollectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/collections")
@RequiredArgsConstructor

public class CollectionController {

    private final CollectionService collectionService;

    @GetMapping
    public ResponseEntity<List<CollectionResponse>> getAllCollections() {
        return ResponseEntity.ok(collectionService.getAllCollections());
    }

    @GetMapping("/site/{siteId}")
    public ResponseEntity<List<CollectionResponse>> getCollectionsBySiteId(@PathVariable UUID siteId) {
        return ResponseEntity.ok(collectionService.getCollectionsBySiteId(siteId));
    }

    @PreAuthorize("hasAnyRole('OWNER','ADMIN','SITE_MANAGER')")
    @PostMapping
    public ResponseEntity<CollectionResponse> createCollection(@RequestBody CollectionRequest request) {
        return ResponseEntity.ok(collectionService.createCollection(request));
    }

    @PreAuthorize("hasAnyRole('OWNER','ADMIN','SITE_MANAGER')")
    @PutMapping("/{id}")
    public ResponseEntity<CollectionResponse> updateCollection(@PathVariable UUID id,
            @RequestBody CollectionRequest request) {
        return ResponseEntity.ok(collectionService.updateCollection(id, request));
    }

    @PreAuthorize("hasAnyRole('OWNER','ADMIN','SITE_MANAGER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCollection(@PathVariable UUID id) {
        collectionService.deleteCollection(id);
        return ResponseEntity.noContent().build();
    }
}
