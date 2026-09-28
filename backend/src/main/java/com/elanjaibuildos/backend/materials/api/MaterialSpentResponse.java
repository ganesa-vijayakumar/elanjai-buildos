package com.elanjaibuildos.backend.materials.api;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import com.elanjaibuildos.backend.materials.domain.MaterialType;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MaterialSpentResponse {
    private UUID id;
    private UUID siteId;
    private com.elanjaibuildos.backend.materials.domain.MaterialType materialType;
    private BigDecimal quantity;
    private String unit;
    private UUID updatedBy;
    private LocalDateTime updatedAt;
}
