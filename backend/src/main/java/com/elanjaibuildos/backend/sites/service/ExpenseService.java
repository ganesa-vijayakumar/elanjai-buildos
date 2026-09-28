package com.elanjaibuildos.backend.sites.service;

import com.elanjaibuildos.backend.sites.api.ExpenseRequest;
import com.elanjaibuildos.backend.sites.api.ExpenseResponse;
import com.elanjaibuildos.backend.sites.domain.Expense;
import com.elanjaibuildos.backend.sites.domain.ExpenseApprovalStatus;
import com.elanjaibuildos.backend.sites.domain.Site;
import com.elanjaibuildos.backend.identity.domain.User;
import com.elanjaibuildos.backend.sites.repository.ExpenseRepository;
import com.elanjaibuildos.backend.sites.repository.SiteRepository;
import com.elanjaibuildos.backend.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import com.elanjaibuildos.backend.notifications.service.NotificationService;
import com.elanjaibuildos.backend.identity.domain.Role;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final SiteRepository siteRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public List<ExpenseResponse> getAllExpenses() {
        return expenseRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ExpenseResponse> getExpensesBySiteId(UUID siteId) {
        return expenseRepository.findBySiteId(siteId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // TODO: Filter by permissions

    public ExpenseResponse createExpense(ExpenseRequest request) {
        User currentUser = getCurrentUser();
        Site site = siteRepository.findById(request.getSiteId())
                .orElseThrow(() -> new RuntimeException("Site not found"));

        ExpenseApprovalStatus status = ExpenseApprovalStatus.PENDING;
        if (currentUser.getRole() == com.elanjaibuildos.backend.identity.domain.Role.OWNER ||
                currentUser.getRole() == com.elanjaibuildos.backend.identity.domain.Role.ADMIN) {
            status = ExpenseApprovalStatus.APPROVED;
        }

        Expense expense = Expense.builder()
                .site(site)
                .category(request.getCategory())
                .itemName(request.getItemName())
                .quantity(request.getQuantity())
                .unit(request.getUnit())
                .unitPrice(request.getUnitPrice())
                .totalAmount(request.getTotalAmount())
                .paidTo(request.getPaidTo())
                .paymentMode(request.getPaymentMode())
                .billImageUrl(request.getBillImageUrl())
                .expenseDate(request.getExpenseDate())
                .approvalStatus(status)
                .approvedBy(status == ExpenseApprovalStatus.APPROVED ? currentUser : null)
                .approvedAt(status == ExpenseApprovalStatus.APPROVED ? LocalDateTime.now() : null)
                .createdBy(currentUser)
                .build();

        Expense saved = expenseRepository.save(expense);
        if (status == ExpenseApprovalStatus.PENDING) notifyApprovers(currentUser, saved, site);
        return mapToResponse(saved);
    }

    /** Alert owner/admins that a staff expense needs sign-off. */
    private void notifyApprovers(User submitter, Expense expense, Site site) {
        try {
            for (com.elanjaibuildos.backend.identity.domain.Role r :
                    new com.elanjaibuildos.backend.identity.domain.Role[]{com.elanjaibuildos.backend.identity.domain.Role.OWNER,
                            com.elanjaibuildos.backend.identity.domain.Role.ADMIN}) {
                for (User u : userRepository.findByRole(r)) {
                    if (u.getId().equals(submitter.getId())) continue;
                    notificationService.toUser(u.getId(), "expense_pending",
                            "New expense pending approval",
                            submitter.getFullName() + " submitted " +
                                    (expense.getItemName() != null ? expense.getItemName() : "an expense") +
                                    " of " + expense.getTotalAmount() +
                                    (site != null ? " for " + site.getSiteName() : "") + ".", null);
                }
            }
        } catch (Exception ignored) { }
    }

    public ExpenseResponse updateExpense(UUID id, ExpenseRequest request) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found"));

        expense.setCategory(request.getCategory());
        expense.setItemName(request.getItemName());
        expense.setQuantity(request.getQuantity());
        expense.setUnit(request.getUnit());
        expense.setUnitPrice(request.getUnitPrice());
        expense.setTotalAmount(request.getTotalAmount());
        expense.setPaidTo(request.getPaidTo());
        expense.setPaymentMode(request.getPaymentMode());
        expense.setBillImageUrl(request.getBillImageUrl());
        expense.setExpenseDate(request.getExpenseDate());

        // Handle approval updates if provided (e.g. by admin)
        if (request.getApprovalStatus() != null) {
            expense.setApprovalStatus(request.getApprovalStatus());
            if (request.getApprovalStatus() == ExpenseApprovalStatus.APPROVED ||
                    request.getApprovalStatus() == ExpenseApprovalStatus.REJECTED) {
                expense.setApprovedBy(getCurrentUser());
                expense.setApprovedAt(LocalDateTime.now());
            }
        }
        if (request.getRejectionReason() != null) {
            expense.setRejectionReason(request.getRejectionReason());
        }

        return mapToResponse(expenseRepository.save(expense));
    }

    public void deleteExpense(UUID id) {
        expenseRepository.deleteById(id);
    }

    private User getCurrentUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) throw new RuntimeException("User not found in context");
        return userRepository.findByEmail(auth.getName()).orElseThrow();
    }

    private ExpenseResponse mapToResponse(Expense expense) {
        return ExpenseResponse.builder()
                .id(expense.getId())
                .siteId(expense.getSite().getId())
                .siteName(expense.getSite().getSiteName())
                .category(expense.getCategory())
                .itemName(expense.getItemName())
                .quantity(expense.getQuantity())
                .unit(expense.getUnit())
                .unitPrice(expense.getUnitPrice())
                .totalAmount(expense.getTotalAmount())
                .paidTo(expense.getPaidTo())
                .paymentMode(expense.getPaymentMode())
                .billImageUrl(expense.getBillImageUrl())
                .expenseDate(expense.getExpenseDate())
                .approvalStatus(expense.getApprovalStatus())
                .approvedBy(expense.getApprovedBy() != null ? expense.getApprovedBy().getId() : null)
                .approvedAt(expense.getApprovedAt())
                .rejectionReason(expense.getRejectionReason())
                .createdBy(expense.getCreatedBy() != null ? expense.getCreatedBy().getId() : null)
                .createdAt(expense.getCreatedAt())
                .build();
    }
}
