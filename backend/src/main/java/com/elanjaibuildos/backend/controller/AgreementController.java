package com.elanjaibuildos.backend.controller;

import com.elanjaibuildos.backend.model.Quotation;
import com.elanjaibuildos.backend.model.Setting;
import com.elanjaibuildos.backend.repository.QuotationRepository;
import com.elanjaibuildos.backend.repository.SettingRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/** Construction agreement PDF (F-043): A4 letterhead + stage payment schedule from a signed quotation. */
@RestController
@RequestMapping("/api/quotations")
@RequiredArgsConstructor
public class AgreementController {

    private final QuotationRepository quotations;
    private final SettingRepository settings;
    private final ObjectMapper om = new ObjectMapper();

    @GetMapping("/{id}/agreement.pdf")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<byte[]> agreement(@PathVariable UUID id) throws Exception {
        Quotation q = quotations.findById(id).orElseThrow();
        byte[] pdf = render(q);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"agreement-" + (q.getQuotationNumber() != null ? q.getQuotationNumber() : id) + ".pdf\"")
                .body(pdf);
    }

    private String setting(String key) {
        return settings.findByKey(key).map(Setting::getValue).orElse(null);
    }

    private JsonNode json(String raw) {
        try { return raw != null ? om.readTree(raw) : null; } catch (Exception e) { return null; }
    }

    private byte[] render(Quotation q) throws Exception {
        // company profile + branding from tenant settings
        JsonNode company = json(setting("company_profile"));
        JsonNode branding = json(setting("branding"));
        String companyName = text(company, "company_name", "ELANJAI BUILDOS");
        String companyAddr = text(company, "company_address", "");
        String companyPhone = text(company, "company_phone", "");
        String companyEmail = text(company, "company_email", "");
        String accent = branding != null && branding.has("accentColor")
                ? branding.get("accentColor").asText() : "#0f766e";

        // payment schedule rows from the stage breakdown JSON
        List<String> rows = new ArrayList<>();
        JsonNode breakdown = json(q.getStageBreakdown());
        BigDecimal total = q.getTotalValue() != null ? q.getTotalValue() : BigDecimal.ZERO;
        int i = 1;
        if (breakdown != null && breakdown.isArray()) {
            for (JsonNode s : breakdown) {
                String name = s.has("stage") ? s.get("stage").asText()
                        : s.has("name") ? s.get("name").asText() : "Stage " + i;
                String pct = s.has("percentage") ? s.get("percentage").asText() : "-";
                BigDecimal amt = s.has("amount") && s.get("amount").isNumber()
                        ? s.get("amount").decimalValue()
                        : (s.has("percentage") ? total.multiply(s.get("percentage").decimalValue())
                                .divide(new BigDecimal(100), 2, java.math.RoundingMode.HALF_UP) : null);
                rows.add("<tr><td>" + i++ + "</td><td>" + esc(name) + "</td><td class='r'>" + esc(pct) + "%</td><td class='r'>"
                        + (amt != null ? "&#8377; " + amt.toPlainString() : "-") + "</td></tr>");
            }
        }
        if (rows.isEmpty()) rows.add("<tr><td>1</td><td>Full contract value</td><td class='r'>100%</td><td class='r'>&#8377; " + total.toPlainString() + "</td></tr>");

        String date = q.getCreatedAt() != null
                ? q.getCreatedAt().format(DateTimeFormatter.ofPattern("dd MMM yyyy")) : "";

        String html = """
            <html><head><style>
            @page { size: A4; margin: 22mm 18mm; }
            body { font-family: 'DejaVu Sans', sans-serif; color: #1f2937; font-size: 10.5pt; }
            .head { border-bottom: 3px solid %s; padding-bottom: 12px; margin-bottom: 24px; }
            .company { font-size: 18pt; font-weight: bold; color: %s; }
            .cinfo { color: #6b7280; font-size: 9pt; margin-top: 4px; }
            h1 { font-size: 15pt; text-align: center; margin: 18px 0 4px; letter-spacing: 1px; }
            .sub { text-align: center; color: #6b7280; font-size: 9pt; margin-bottom: 20px; }
            table { width: 100%%; border-collapse: collapse; margin-top: 8px; }
            th, td { border: 1px solid #d1d5db; padding: 7px 9px; font-size: 9.5pt; }
            th { background: #f3f4f6; text-align: left; }
            td.r, th.r { text-align: right; }
            .lbl { color: #6b7280; width: 34%%; }
            .total td { font-weight: bold; background: #f9fafb; }
            .terms { margin-top: 22px; font-size: 9pt; color: #374151; }
            .terms li { margin-bottom: 5px; }
            .sig { margin-top: 60px; width: 100%%; }
            .sig td { border: none; padding-top: 40px; width: 50%%; font-size: 9.5pt; }
            .sigline { border-top: 1px solid #9ca3af; width: 70%%; padding-top: 5px; }
            </style></head><body>
            <div class="head">
              <div class="company">%s</div>
              <div class="cinfo">%s%s%s</div>
            </div>
            <h1>CONSTRUCTION AGREEMENT</h1>
            <div class="sub">Agreement ref: %s &#160;&#8226;&#160; Date: %s</div>
            <table>
              <tr><td class="lbl">Client</td><td><b>%s</b></td></tr>
              <tr><td class="lbl">Client contact</td><td>%s</td></tr>
              <tr><td class="lbl">Project location</td><td>%s</td></tr>
              <tr><td class="lbl">Built-up area</td><td>%s</td></tr>
              <tr><td class="lbl">Package</td><td>%s</td></tr>
              <tr><td class="lbl">Rate per sq.ft</td><td>%s</td></tr>
              <tr class="total"><td class="lbl">Total contract value</td><td>&#8377; %s</td></tr>
            </table>
            <h1 style="font-size:12pt; text-align:left; margin-top:26px;">PAYMENT SCHEDULE</h1>
            <table>
              <tr><th style="width:8%%;">#</th><th>Stage</th><th class="r" style="width:16%%;">%%</th><th class="r" style="width:22%%;">Amount</th></tr>
              %s
            </table>
            <div class="terms">
              <b>Terms:</b>
              <ol>
                <li>Payments are due at the completion of each stage as per the schedule above.</li>
                <li>Any change requests will be documented and priced separately before execution.</li>
                <li>This agreement is governed by the quotation referenced above.</li>
              </ol>
            </div>
            <table class="sig"><tr>
              <td><div class="sigline">For %s (Builder)</div></td>
              <td><div class="sigline">Client signature</div></td>
            </tr></table>
            </body></html>
            """.formatted(
                accent, accent,
                esc(companyName),
                esc(companyAddr), companyAddr.isBlank() ? "" : " &#160;&#8226;&#160; ",
                esc(companyPhone + (companyEmail.isBlank() ? "" : " · " + companyEmail)),
                esc(q.getQuotationNumber() != null ? q.getQuotationNumber() : String.valueOf(q.getId())), esc(date),
                esc(q.getClientName()), esc(joinNonBlank(" · ", q.getClientPhone(), q.getClientEmail())),
                esc(q.getLocation() != null ? q.getLocation() : "-"),
                q.getBuiltupArea() != null ? q.getBuiltupArea().toPlainString() + " sq.ft" : "-",
                q.getPackageName() != null ? q.getPackageName().name() : "-",
                q.getRatePerSqft() != null ? "&#8377; " + q.getRatePerSqft().toPlainString() : "-",
                total.toPlainString(),
                String.join("\n", rows),
                esc(companyName));

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PdfRendererBuilder b = new PdfRendererBuilder();
            b.useFastMode();
            b.withHtmlContent(html, null);
            b.toStream(out);
            b.run();
            return out.toByteArray();
        }
    }

    private String text(JsonNode n, String k, String def) {
        return n != null && n.has(k) && !n.get(k).isNull() ? n.get(k).asText() : def;
    }

    private String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }

    private String joinNonBlank(String sep, String... parts) {
        StringBuilder sb = new StringBuilder();
        for (String p : parts) {
            if (p == null || p.isBlank()) continue;
            if (sb.length() > 0) sb.append(sep);
            sb.append(p);
        }
        return sb.length() > 0 ? sb.toString() : "-";
    }
}
