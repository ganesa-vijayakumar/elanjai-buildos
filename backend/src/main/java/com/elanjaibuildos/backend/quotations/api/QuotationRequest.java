package com.elanjaibuildos.backend.quotations.api;

import com.elanjaibuildos.backend.materials.domain.PackageName;
import com.elanjaibuildos.backend.quotations.domain.QuotationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class QuotationRequest {
    private String clientName;
    private String clientPhone;
    private String clientEmail;
    private String location;
    private BigDecimal builtupArea;
    private BigDecimal ratePerSqft;
    private PackageName packageName;
    private BigDecimal totalValue;
    private String stageBreakdown; // JSON string
    private QuotationStatus status;
}
