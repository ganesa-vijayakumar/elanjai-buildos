package com.elanjaibuildos.backend.quotations.web;

import com.elanjaibuildos.backend.quotations.service.ApprovalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/** Owner/Admin approval queue for expenses + collections. */
@RestController
@RequestMapping("/api/approvals")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
public class ApprovalController {

    private final ApprovalService approvals;

    @GetMapping("/pending")
    public Map<String, Object> pending() {
        return approvals.pending();
    }

    public record DecisionBody(String reason) {}

    @PostMapping("/expenses/{id}/approve")
    public ResponseEntity<?> approveExpense(@PathVariable UUID id) {
        return ResponseEntity.ok(approvals.approveExpense(id));
    }

    @PostMapping("/expenses/{id}/reject")
    public ResponseEntity<?> rejectExpense(@PathVariable UUID id, @RequestBody(required = false) DecisionBody b) {
        return ResponseEntity.ok(approvals.rejectExpense(id, b != null ? b.reason() : null));
    }

    @PostMapping("/collections/{id}/approve")
    public ResponseEntity<?> approveCollection(@PathVariable UUID id) {
        return ResponseEntity.ok(approvals.approveCollection(id));
    }

    @PostMapping("/collections/{id}/reject")
    public ResponseEntity<?> rejectCollection(@PathVariable UUID id, @RequestBody(required = false) DecisionBody b) {
        return ResponseEntity.ok(approvals.rejectCollection(id, b != null ? b.reason() : null));
    }
}
