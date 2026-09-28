package com.elanjaibuildos.backend.dto;

import com.elanjaibuildos.backend.model.PaymentMode;
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
public class CollectionRequest {
    private UUID siteId;
    private BigDecimal amount;
    /** site_stages row id (optional) */
    private UUID stageId;
    /** stage display name */
    private String stage;
    private PaymentMode paymentMode;
    private String referenceNumber;
    private String notes;
    private LocalDate receivedDate;
}
