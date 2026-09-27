package com.elanjaibuildos.backend.dto;

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
public class MaterialSpentRequest {
    private UUID siteId;
    private com.elanjaibuildos.backend.model.MaterialType materialType;
    private BigDecimal quantity;
    private String unit;
}
