package com.elanjaibuildos.backend.controller;

import com.elanjaibuildos.backend.model.Collection;
import com.elanjaibuildos.backend.model.Expense;
import com.elanjaibuildos.backend.model.Site;
import com.elanjaibuildos.backend.repository.CollectionRepository;
import com.elanjaibuildos.backend.repository.ExpenseRepository;
import com.elanjaibuildos.backend.repository.SiteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.List;

/** Reports CSV export (F-049): collections / expenses / sites summary. */
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('OWNER','ADMIN','SITE_MANAGER')")
public class ReportController {

    private final CollectionRepository collections;
    private final ExpenseRepository expenses;
    private final SiteRepository sites;

    @GetMapping("/export.csv")
    public ResponseEntity<byte[]> export(@RequestParam(defaultValue = "collections") String type) {
        String filename = type + "-" + java.time.LocalDate.now() + ".csv";
        String csv = switch (type) {
            case "expenses" -> expensesCsv();
            case "sites" -> sitesCsv();
            default -> collectionsCsv();
        };
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(csv.getBytes(StandardCharsets.UTF_8));
    }

    private String collectionsCsv() {
        StringBuilder sb = new StringBuilder("date,site,stage,amount,payment_mode,reference,status,notes\n");
        List<Collection> rows = collections.findAll();
        for (Collection c : rows) {
            sb.append(esc(c.getReceivedDate() != null ? c.getReceivedDate().toString() : "")).append(',')
              .append(esc(c.getSite() != null ? c.getSite().getSiteName() : "")).append(',')
              .append(esc(c.getStage() != null ? c.getStage() : "")).append(',')
              .append(c.getAmount() != null ? c.getAmount().toPlainString() : "0").append(',')
              .append(esc(c.getPaymentMode() != null ? c.getPaymentMode().name() : "")).append(',')
              .append(esc(c.getReferenceNumber() != null ? c.getReferenceNumber() : "")).append(',')
              .append(c.getApprovalStatus() != null ? c.getApprovalStatus().name() : "").append(',')
              .append(esc(c.getNotes() != null ? c.getNotes() : "")).append('\n');
        }
        return sb.toString();
    }

    private String expensesCsv() {
        StringBuilder sb = new StringBuilder("date,site,category,item,quantity,unit,unit_price,total,paid_to,payment_mode,status\n");
        List<Expense> rows = expenses.findAll();
        for (Expense e : rows) {
            sb.append(esc(e.getExpenseDate() != null ? e.getExpenseDate().toString() : "")).append(',')
              .append(esc(e.getSite() != null ? e.getSite().getSiteName() : "")).append(',')
              .append(esc(e.getCategory() != null ? e.getCategory().name() : "")).append(',')
              .append(esc(e.getItemName() != null ? e.getItemName() : "")).append(',')
              .append(e.getQuantity() != null ? e.getQuantity().toPlainString() : "").append(',')
              .append(esc(e.getUnit() != null ? e.getUnit() : "")).append(',')
              .append(e.getUnitPrice() != null ? e.getUnitPrice().toPlainString() : "").append(',')
              .append(e.getTotalAmount() != null ? e.getTotalAmount().toPlainString() : "0").append(',')
              .append(esc(e.getPaidTo() != null ? e.getPaidTo() : "")).append(',')
              .append(esc(e.getPaymentMode() != null ? e.getPaymentMode().name() : "")).append(',')
              .append(e.getApprovalStatus() != null ? e.getApprovalStatus().name() : "").append('\n');
        }
        return sb.toString();
    }

    private String sitesCsv() {
        StringBuilder sb = new StringBuilder("site,client,location,total_value,collected,spent,current_stage,status\n");
        java.util.Map<java.util.UUID, java.math.BigDecimal> collected = new java.util.HashMap<>();
        for (Collection c : collections.findAll()) {
            if (c.getSite() == null) continue;
            if (c.getApprovalStatus() != null &&
                    c.getApprovalStatus() != com.elanjaibuildos.backend.model.ExpenseApprovalStatus.APPROVED) continue;
            collected.merge(c.getSite().getId(),
                    c.getAmount() != null ? c.getAmount() : java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        }
        java.util.Map<java.util.UUID, java.math.BigDecimal> spent = new java.util.HashMap<>();
        for (Expense e : expenses.findAll()) {
            if (e.getSite() == null) continue;
            if (e.getApprovalStatus() != null &&
                    e.getApprovalStatus() != com.elanjaibuildos.backend.model.ExpenseApprovalStatus.APPROVED) continue;
            spent.merge(e.getSite().getId(),
                    e.getTotalAmount() != null ? e.getTotalAmount() : java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        }
        List<Site> rows = sites.findAll();
        for (Site s : rows) {
            sb.append(esc(s.getSiteName() != null ? s.getSiteName() : "")).append(',')
              .append(esc(s.getClientName() != null ? s.getClientName() : "")).append(',')
              .append(esc(s.getLocation() != null ? s.getLocation() : "")).append(',')
              .append(s.getTotalValue() != null ? s.getTotalValue().toPlainString() : "0").append(',')
              .append(collected.getOrDefault(s.getId(), java.math.BigDecimal.ZERO).toPlainString()).append(',')
              .append(spent.getOrDefault(s.getId(), java.math.BigDecimal.ZERO).toPlainString()).append(',')
              .append(esc(s.getCurrentStage() != null ? s.getCurrentStage() : "")).append(',')
              .append(s.getStatus() != null ? s.getStatus().name() : "").append('\n');
        }
        return sb.toString();
    }

    private String esc(String v) {
        if (v == null) return "";
        return v.contains(",") || v.contains("\"") || v.contains("\n")
                ? "\"" + v.replace("\"", "\"\"") + "\"" : v;
    }
}
