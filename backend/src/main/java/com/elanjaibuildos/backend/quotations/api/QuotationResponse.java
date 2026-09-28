package com.elanjaibuildos.backend.quotations.api;

import com.elanjaibuildos.backend.materials.domain.PackageName;
import com.elanjaibuildos.backend.quotations.domain.QuotationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class QuotationResponse {
    private UUID id;
    private String quotationNumber;
    private String clientName;
    private String clientPhone;
    private String clientEmail;
    private String location;
    private BigDecimal builtupArea;
    private BigDecimal ratePerSqft;
    private PackageName packageName;
    private BigDecimal totalValue;
    private String stageBreakdown;
    private QuotationStatus status;
    private UUID convertedSiteId;
    private UUID createdBy;
    private LocalDateTime createdAt;
}
