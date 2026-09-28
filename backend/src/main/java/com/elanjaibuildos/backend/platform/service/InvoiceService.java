package com.elanjaibuildos.backend.platform.service;

import com.elanjaibuildos.backend.platform.model.Invoice;
import com.elanjaibuildos.backend.platform.model.Plan;
import com.elanjaibuildos.backend.platform.model.Tenant;
import com.elanjaibuildos.backend.platform.repository.InvoiceRepository;
import com.elanjaibuildos.backend.platform.repository.PlatformSettingRepository;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/**
 * GST invoice issuance (F-014): sequential INV-YYYY-NNNNN per FY,
 * CGST+SGST intra-state / IGST inter-state, PDF via OpenHTMLtoPDF.
 */
@Service
public class InvoiceService {

    private static final BigDecimal GST_RATE = new BigDecimal("0.18");
    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    private final InvoiceRepository invoices;
    private final PlatformSettingRepository settings;

    @Value("${app.storage.root:./data/files}")
    private String storageRoot;

    public InvoiceService(InvoiceRepository invoices, PlatformSettingRepository settings) {
        this.invoices = invoices;
        this.settings = settings;
    }

    @Transactional
    public Invoice issue(Tenant tenant, Plan plan, String billingCycle) {
        BigDecimal base = BigDecimal.valueOf(
                "yearly".equals(billingCycle) ? plan.getPriceYearlyInr() : plan.getPriceMonthlyInr());

        Invoice inv = new Invoice();
        inv.setTenant(tenant);
        inv.setPlan(plan);
        inv.setInvoiceNumber(nextNumber());
        inv.setPeriodStart(LocalDate.now(IST));
        inv.setPeriodEnd("yearly".equals(billingCycle)
                ? LocalDate.now(IST).plusYears(1) : LocalDate.now(IST).plusMonths(1));
        inv.setDescription(plan.getName() + " plan — " + billingCycle + " subscription");
        inv.setTaxableAmount(base);

        // intra-state → CGST+SGST; inter-state → IGST (platform state vs tenant state)
        String platformState = settings.findValueByKey("platform.state").orElse("Tamil Nadu");
        boolean intraState = tenant.getState() == null
                || tenant.getState().equalsIgnoreCase(platformState);
        BigDecimal gst = base.multiply(GST_RATE).setScale(2, RoundingMode.HALF_UP);
        if (intraState) {
            inv.setCgst(gst.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP));
            inv.setSgst(gst.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP));
        } else {
            inv.setIgst(gst);
        }
        inv.setTotalInr(base.add(gst));
        inv.setStatus(Invoice.Status.issued);
        inv.setIssuedAt(Instant.now());
        invoices.save(inv);

        try {
            inv.setPdfPath(renderPdf(inv, tenant, plan));
            invoices.save(inv);
        } catch (Exception e) {
            // PDF failure must not lose the issued invoice — regenerate on demand
            org.slf4j.LoggerFactory.getLogger(InvoiceService.class)
                    .warn("Invoice PDF render failed for {}: {}", inv.getInvoiceNumber(), e.getMessage());
        }
        return inv;
    }

    /** INV-YYYY-NNNNN sequential per financial year via platform_settings counter. */
    private synchronized String nextNumber() {
        int fy = LocalDate.now(IST).getMonthValue() >= 4
                ? LocalDate.now(IST).getYear() : LocalDate.now(IST).getYear() - 1;
        String key = "invoice.sequence." + fy;
        var row = settings.findById(key).orElseGet(() -> {
            var s = new com.elanjaibuildos.backend.platform.model.PlatformSetting();
            s.setKey(key); s.setValue("0");
            return s;
        });
        int next = Integer.parseInt(row.getValue() == null ? "0" : row.getValue()) + 1;
        row.setValue(String.valueOf(next));
        settings.save(row);
        return "INV-" + fy + "-" + String.format("%05d", next);
    }

    private String renderPdf(Invoice inv, Tenant tenant, Plan plan) throws Exception {
        String gstin = settings.findValueByKey("platform.gstin").orElse("");
        String platformName = settings.findValueByKey("platform.name").orElse("Elanjai Technologies");
        String sac = settings.findValueByKey("platform.sac_code").orElse("998314");

        String html = """
            <!DOCTYPE html><html><head><meta charset="utf-8"/><style>
            body{font-family:sans-serif;color:#0f172a;margin:40px}
            h1{font-size:20px} table{width:100%%;border-collapse:collapse;margin-top:20px}
            td,th{border:1px solid #e2e8f0;padding:8px;font-size:12px;text-align:left}
            .right{text-align:right} .muted{color:#64748b}
            </style></head><body>
            <h1>Tax Invoice</h1>
            <p class="muted">%s · GSTIN: %s · SAC %s<br/>Invoice %s · %s</p>
            <p><b>Billed to:</b><br/>%s<br/>%s %s<br/>State: %s</p>
            <table><tr><th>Description</th><th>Period</th><th class="right">Amount (₹)</th></tr>
            <tr><td>%s</td><td>%s → %s</td><td class="right">%.2f</td></tr>
            <tr><td colspan="2" class="right"><b>Taxable</b></td><td class="right">%.2f</td></tr>
            %s%s%s
            <tr><td colspan="2" class="right"><b>Total</b></td><td class="right"><b>%.2f</b></td></tr>
            </table></body></html>
            """.formatted(platformName, gstin, sac, inv.getInvoiceNumber(),
                inv.getIssuedAt().atZone(IST).format(DateTimeFormatter.ISO_LOCAL_DATE),
                tenant.getCompanyName(), tenant.getOwnerName(),
                tenant.getGstin() != null ? "· GSTIN: " + tenant.getGstin() : "",
                tenant.getState() != null ? tenant.getState() : "-",
                inv.getDescription(), inv.getPeriodStart(), inv.getPeriodEnd(),
                inv.getTaxableAmount(), inv.getTaxableAmount(),
                inv.getCgst().signum() > 0
                        ? "<tr><td colspan='2' class='right'>CGST 9%</td><td class='right'>"
                          + inv.getCgst() + "</td></tr>" : "",
                inv.getSgst().signum() > 0
                        ? "<tr><td colspan='2' class='right'>SGST 9%</td><td class='right'>"
                          + inv.getSgst() + "</td></tr>" : "",
                inv.getIgst().signum() > 0
                        ? "<tr><td colspan='2' class='right'>IGST 18%</td><td class='right'>"
                          + inv.getIgst() + "</td></tr>" : "",
                inv.getTotalInr());

        Path dir = Path.of(storageRoot, "public", "invoices");
        Files.createDirectories(dir);
        Path file = dir.resolve(inv.getInvoiceNumber() + ".pdf");
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PdfRendererBuilder b = new PdfRendererBuilder();
            b.useFastMode();
            b.withHtmlContent(html, null);
            b.toStream(out);
            b.run();
            Files.write(file, out.toByteArray());
        }
        return "public/invoices/" + inv.getInvoiceNumber() + ".pdf";
    }
}
