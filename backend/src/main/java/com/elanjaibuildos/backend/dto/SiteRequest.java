package com.elanjaibuildos.backend.dto;

import com.elanjaibuildos.backend.model.ConstructionStage;
import com.elanjaibuildos.backend.model.PackageName;
import com.elanjaibuildos.backend.model.SiteStatus;
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
public class SiteRequest {
    private String siteName;
    private String clientName;
    private String clientPhone;
    private String clientEmail;
    private UUID clientUserId;
    private String location;
    private BigDecimal builtupArea;
    private BigDecimal ratePerSqft;
    private PackageName packageName;
    private BigDecimal totalValue;
    private ConstructionStage currentStage;
    private SiteStatus status;
    private LocalDate startDate;
    private LocalDate expectedEndDate;
    private BigDecimal estimatedMaterialExpense;
}
