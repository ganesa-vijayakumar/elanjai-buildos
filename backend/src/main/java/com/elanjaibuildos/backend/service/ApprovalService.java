package com.elanjaibuildos.backend.service;

import com.elanjaibuildos.backend.model.Collection;
import com.elanjaibuildos.backend.model.Expense;
import com.elanjaibuildos.backend.model.ExpenseApprovalStatus;
import com.elanjaibuildos.backend.model.User;
import com.elanjaibuildos.backend.repository.CollectionRepository;
import com.elanjaibuildos.backend.repository.ExpenseRepository;
import com.elanjaibuildos.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Owner/Admin approvals for expenses and collections (BR: site-manager entries need sign-off). */
@Service
@RequiredArgsConstructor
public class ApprovalService {

    private final ExpenseRepository expenses;
    private final CollectionRepository collections;
    private final UserRepository users;
    private final NotificationService notificationService;

    public Map<String, Object> pending() {
        List<Map<String, Object>> exp = expenses.findAll().stream()
                .filter(e -> e.getApprovalStatus() == ExpenseApprovalStatus.PENDING)
                .map(e -> row("expense", e.getId(), e.getSite() != null ? e.getSite().getId() : null,
                        e.getItemName(), e.getTotalAmount(), e.getExpenseDate() != null ? e.getExpenseDate().toString() : null,
                        e.getCreatedBy() != null ? e.getCreatedBy().getFullName() : null))
                .toList();
        List<Map<String, Object>> col = collections.findAll().stream()
                .filter(c -> c.getApprovalStatus() == ExpenseApprovalStatus.PENDING)
                .map(c -> row("collection", c.getId(), c.getSite() != null ? c.getSite().getId() : null,
                        "Collection " + (c.getStage() != null ? c.getStage() : ""), c.getAmount(),
                        c.getReceivedDate() != null ? c.getReceivedDate().toString() : null,
                        c.getCreatedBy() != null ? c.getCreatedBy().getFullName() : null))
                .toList();
        return Map.of("expenses", exp, "collections", col, "count", exp.size() + col.size());
    }

    private Map<String, Object> row(String kind, UUID id, UUID siteId, String label,
                                    Object amount, String date, String by) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("kind", kind); m.put("id", id); m.put("siteId", siteId);
        m.put("label", label); m.put("amount", amount); m.put("date", date); m.put("by", by);
        return m;
    }

    @Transactional
    public Expense approveExpense(UUID id) {
        Expense e = expenses.findById(id).orElseThrow(() -> new RuntimeException("Expense not found"));
        e.setApprovalStatus(ExpenseApprovalStatus.APPROVED);
        e.setApprovedBy(currentUser());
        e.setApprovedAt(LocalDateTime.now());
        e.setRejectionReason(null);
        Expense saved = expenses.save(e);
        notifyCreator(e.getCreatedBy(), "expense_approved", "Expense approved",
                (e.getItemName() != null ? e.getItemName() : "Expense") + " was approved.", null);
        return saved;
    }

    @Transactional
    public Expense rejectExpense(UUID id, String reason) {
        Expense e = expenses.findById(id).orElseThrow(() -> new RuntimeException("Expense not found"));
        e.setApprovalStatus(ExpenseApprovalStatus.REJECTED);
        e.setRejectionReason(reason);
        Expense saved = expenses.save(e);
        notifyCreator(e.getCreatedBy(), "expense_rejected", "Expense rejected",
                (e.getItemName() != null ? e.getItemName() : "Expense") + " was rejected" +
                (reason != null ? ": " + reason : "."), null);
        return saved;
    }

    @Transactional
    public Collection approveCollection(UUID id) {
        Collection c = collections.findById(id).orElseThrow(() -> new RuntimeException("Collection not found"));
        c.setApprovalStatus(ExpenseApprovalStatus.APPROVED);
        c.setApprovedBy(currentUser());
        c.setApprovedAt(LocalDateTime.now());
        c.setRejectionReason(null);
        Collection saved = collections.save(c);
        notifyCreator(c.getCreatedBy(), "collection_approved", "Collection approved",
                "Collection of " + c.getAmount() + " was approved.", null);
        return saved;
    }

    @Transactional
    public Collection rejectCollection(UUID id, String reason) {
        Collection c = collections.findById(id).orElseThrow(() -> new RuntimeException("Collection not found"));
        c.setApprovalStatus(ExpenseApprovalStatus.REJECTED);
        c.setRejectionReason(reason);
        Collection saved = collections.save(c);
        notifyCreator(c.getCreatedBy(), "collection_rejected", "Collection rejected",
                "Collection of " + c.getAmount() + " was rejected" +
                (reason != null ? ": " + reason : "."), null);
        return saved;
    }

    private void notifyCreator(User creator, String type, String title, String message, String link) {
        if (creator == null) return;
        try { notificationService.toUser(creator.getId(), type, title, message, link); }
        catch (Exception ignored) { }
    }

    private User currentUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return users.findByEmail(auth.getName()).orElseThrow();
    }
}
