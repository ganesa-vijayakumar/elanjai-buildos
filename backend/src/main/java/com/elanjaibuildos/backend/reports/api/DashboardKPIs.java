package com.elanjaibuildos.backend.reports.api;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DashboardKPIs {
    private long activeSites;
    private long completedSites;
    private long holdSites;
    private long cancelledSites;
    private BigDecimal totalCollections;
    private BigDecimal totalExpenses;
    private BigDecimal totalEstimatedMaterials;
    private BigDecimal netProfit;
    private double profitMarginPercentage;
}
