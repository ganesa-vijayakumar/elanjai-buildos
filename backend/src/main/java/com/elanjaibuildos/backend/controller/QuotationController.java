package com.elanjaibuildos.backend.controller;

import com.elanjaibuildos.backend.dto.QuotationRequest;
import com.elanjaibuildos.backend.dto.QuotationResponse;
import com.elanjaibuildos.backend.service.QuotationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/quotations")
@RequiredArgsConstructor
public class QuotationController {

    private final QuotationService quotationService;

    @GetMapping
    public ResponseEntity<List<QuotationResponse>> getAllQuotations() {
        return ResponseEntity.ok(quotationService.getAllQuotations());
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuotationResponse> getQuotationById(@PathVariable UUID id) {
        return ResponseEntity.ok(quotationService.getQuotationById(id));
    }

    @PostMapping
    public ResponseEntity<QuotationResponse> createQuotation(@RequestBody QuotationRequest request) {
        return ResponseEntity.ok(quotationService.createQuotation(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<QuotationResponse> updateQuotation(@PathVariable UUID id,
            @RequestBody QuotationRequest request) {
        return ResponseEntity.ok(quotationService.updateQuotation(id, request));
    }

    @PostMapping("/{id}/convert")
    public ResponseEntity<QuotationResponse> convertToSite(@PathVariable UUID id) {
        return ResponseEntity.ok(quotationService.convertToSite(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuotation(@PathVariable UUID id) {
        quotationService.deleteQuotation(id);
        return ResponseEntity.noContent().build();
    }
}
