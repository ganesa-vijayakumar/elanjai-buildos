package com.elanjaibuildos.backend.tenancy.api;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SettingRequest {
    private String key;
    private String value; // JSON string
}
