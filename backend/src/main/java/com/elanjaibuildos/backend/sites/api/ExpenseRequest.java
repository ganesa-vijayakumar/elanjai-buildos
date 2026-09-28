package com.elanjaibuildos.backend.sites.api;

import com.elanjaibuildos.backend.sites.domain.ExpenseApprovalStatus;
import com.elanjaibuildos.backend.sites.domain.ExpenseCategory;
import com.elanjaibuildos.backend.billing.domain.PaymentMode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ExpenseRequest {
    private UUID siteId;
    private ExpenseCategory category;
    private String itemName;
    private BigDecimal quantity;
    private String unit;
    private BigDecimal unitPrice;
    private BigDecimal totalAmount;
    private String paidTo;
    private PaymentMode paymentMode;
    private String billImageUrl;
    private LocalDate expenseDate;
    private ExpenseApprovalStatus approvalStatus; // Admin can set this directly
    private String rejectionReason;
}
