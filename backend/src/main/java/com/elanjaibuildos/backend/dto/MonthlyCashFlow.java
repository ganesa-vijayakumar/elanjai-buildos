package com.elanjaibuildos.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MonthlyCashFlow {
    private LocalDate month;
    private BigDecimal collections;
    private BigDecimal expenses;
    private BigDecimal netFlow;
}
