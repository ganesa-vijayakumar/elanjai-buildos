package com.elanjaibuildos.backend.reports.service;

import com.elanjaibuildos.backend.reports.api.DashboardKPIs;
import com.elanjaibuildos.backend.reports.api.MonthlyCashFlow;
import com.elanjaibuildos.backend.billing.domain.Collection;
import com.elanjaibuildos.backend.sites.domain.Expense;
import com.elanjaibuildos.backend.sites.domain.ExpenseApprovalStatus;
import com.elanjaibuildos.backend.sites.domain.Site;
import com.elanjaibuildos.backend.sites.domain.SiteStatus;
import com.elanjaibuildos.backend.billing.repository.CollectionRepository;
import com.elanjaibuildos.backend.sites.repository.ExpenseRepository;
import com.elanjaibuildos.backend.sites.repository.SiteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

        private final SiteRepository siteRepository;
        private final CollectionRepository collectionRepository;
        private final ExpenseRepository expenseRepository;

        public DashboardKPIs getKPIs() {
                List<Site> sites = siteRepository.findAll();
                List<Collection> collections = collectionRepository.findAll();
                List<Expense> expenses = expenseRepository.findAll();

                long activeSites = siteRepository.countByStatus(SiteStatus.IN_PROGRESS);
                long completedSites = sites.stream().filter(s -> s.getStatus() == SiteStatus.COMPLETED).count();
                long holdSites = sites.stream().filter(s -> s.getStatus() == SiteStatus.HOLD).count();
                long cancelledSites = sites.stream().filter(s -> s.getStatus() == SiteStatus.CANCELLED).count();

                BigDecimal totalCollections = collections.stream()
                                .map(Collection::getAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal totalExpenses = expenses.stream()
                                .filter(e -> e.getApprovalStatus() == ExpenseApprovalStatus.APPROVED)
                                .map(Expense::getTotalAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal totalEstimatedMaterials = sites.stream()
                                .map(s -> s.getEstimatedMaterialExpense() != null ? s.getEstimatedMaterialExpense()
                                                : BigDecimal.ZERO)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal netProfit = totalCollections.subtract(totalExpenses).subtract(totalEstimatedMaterials);

                double profitMarginPercentage = 0.0;
                if (totalCollections.compareTo(BigDecimal.ZERO) > 0) {
                        profitMarginPercentage = netProfit.divide(totalCollections, 4, RoundingMode.HALF_UP)
                                        .multiply(BigDecimal.valueOf(100)).doubleValue();
                }

                return DashboardKPIs.builder()
                                .activeSites(activeSites)
                                .completedSites(completedSites)
                                .holdSites(holdSites)
                                .cancelledSites(cancelledSites)
                                .totalCollections(totalCollections)
                                .totalExpenses(totalExpenses)
                                .totalEstimatedMaterials(totalEstimatedMaterials)
                                .netProfit(netProfit)
                                .profitMarginPercentage(profitMarginPercentage)
                                .build();
        }

        public List<MonthlyCashFlow> getMonthlyCashFlow() {
                List<Collection> collections = collectionRepository.findAll();
                List<Expense> expenses = expenseRepository.findAll();

                Map<YearMonth, BigDecimal> collectionsByMonth = collections.stream()
                                .collect(Collectors.groupingBy(
                                                c -> YearMonth.from(c.getReceivedDate()),
                                                Collectors.reducing(BigDecimal.ZERO, Collection::getAmount,
                                                                BigDecimal::add)));

                Map<YearMonth, BigDecimal> expensesByMonth = expenses.stream()
                                .filter(e -> e.getApprovalStatus() == ExpenseApprovalStatus.APPROVED)
                                .collect(Collectors.groupingBy(
                                                e -> YearMonth.from(e.getExpenseDate()),
                                                Collectors.reducing(BigDecimal.ZERO, Expense::getTotalAmount,
                                                                BigDecimal::add)));

                List<YearMonth> allMonths = new ArrayList<>();
                allMonths.addAll(collectionsByMonth.keySet());
                allMonths.addAll(expensesByMonth.keySet());
                List<YearMonth> sortedMonths = allMonths.stream().distinct().sorted().collect(Collectors.toList());

                return sortedMonths.stream().map(month -> {
                        BigDecimal coll = collectionsByMonth.getOrDefault(month, BigDecimal.ZERO);
                        BigDecimal exp = expensesByMonth.getOrDefault(month, BigDecimal.ZERO);
                        return MonthlyCashFlow.builder()
                                        .month(month.atDay(1))
                                        .collections(coll)
                                        .expenses(exp)
                                        .netFlow(coll.subtract(exp))
                                        .build();
                }).collect(Collectors.toList());
        }
}
