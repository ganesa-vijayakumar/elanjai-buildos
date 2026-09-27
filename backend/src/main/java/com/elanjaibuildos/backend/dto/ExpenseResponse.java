package com.elanjaibuildos.backend.dto;

import com.elanjaibuildos.backend.model.ExpenseApprovalStatus;
import com.elanjaibuildos.backend.model.ExpenseCategory;
import com.elanjaibuildos.backend.model.PaymentMode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ExpenseResponse {
    private UUID id;
    private UUID siteId;
    private String siteName;
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
    private ExpenseApprovalStatus approvalStatus;
    private UUID approvedBy;
    private LocalDateTime approvedAt;
    private String rejectionReason;
    private UUID createdBy;
    private LocalDateTime createdAt;
}
