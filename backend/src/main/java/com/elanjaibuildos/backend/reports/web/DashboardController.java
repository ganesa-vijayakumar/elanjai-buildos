package com.elanjaibuildos.backend.reports.web;

import com.elanjaibuildos.backend.reports.api.DashboardKPIs;
import com.elanjaibuildos.backend.reports.api.MonthlyCashFlow;
import com.elanjaibuildos.backend.reports.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('OWNER','ADMIN','SITE_MANAGER')")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/kpis")
    public ResponseEntity<DashboardKPIs> getKPIs() {
        return ResponseEntity.ok(dashboardService.getKPIs());
    }

    @GetMapping("/cash-flow")
    public ResponseEntity<List<MonthlyCashFlow>> getMonthlyCashFlow() {
        return ResponseEntity.ok(dashboardService.getMonthlyCashFlow());
    }
}
