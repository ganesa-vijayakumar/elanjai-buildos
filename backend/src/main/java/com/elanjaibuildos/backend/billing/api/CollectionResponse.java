package com.elanjaibuildos.backend.billing.api;

import com.elanjaibuildos.backend.sites.domain.ExpenseApprovalStatus;
import com.elanjaibuildos.backend.billing.domain.PaymentMode;
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
public class CollectionResponse {
    private UUID id;
    private UUID siteId;
    private String siteName;
    private BigDecimal amount;
    private UUID stageId;
    private String stage;
    private PaymentMode paymentMode;
    private String referenceNumber;
    private String notes;
    private LocalDate receivedDate;
    private ExpenseApprovalStatus approvalStatus;
    private UUID createdBy;
    private LocalDateTime createdAt;
}
