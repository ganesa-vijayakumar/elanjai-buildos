package com.elanjaibuildos.backend.dto;

import com.elanjaibuildos.backend.model.ConstructionStage;
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
public class CollectionResponse {
    private UUID id;
    private UUID siteId;
    private String siteName;
    private BigDecimal amount;
    private ConstructionStage stage;
    private PaymentMode paymentMode;
    private String referenceNumber;
    private String notes;
    private LocalDate receivedDate;
    private UUID createdBy;
    private LocalDateTime createdAt;
}
