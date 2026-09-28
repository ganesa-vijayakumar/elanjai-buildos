package com.elanjaibuildos.backend.tenancy.api;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SettingResponse {
    private UUID id;
    private String key;
    private String value;
    private UUID updatedBy;
    private LocalDateTime updatedAt;
}
