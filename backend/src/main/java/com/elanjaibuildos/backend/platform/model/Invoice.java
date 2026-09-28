package com.elanjaibuildos.backend.platform.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "invoices")
public class Invoice {

    public enum Status { draft, issued, paid, voided, refunded }

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "invoice_number", nullable = false, unique = true, length = 30)
    private String invoiceNumber;   // INV-YYYY-NNNNN

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscription_id")
    private Subscription subscription;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id")
    private Plan plan;   // plan purchased by this invoice — applied on payment (D-051)

    @Column(name = "razorpay_payment_id") private String razorpayPaymentId;
    @Column(name = "razorpay_order_id") private String razorpayOrderId;
    @Column(name = "period_start") private LocalDate periodStart;
    @Column(name = "period_end") private LocalDate periodEnd;
    @Column(length = 240) private String description;

    @Column(name = "taxable_amount") private BigDecimal taxableAmount = BigDecimal.ZERO;
    private BigDecimal cgst = BigDecimal.ZERO;
    private BigDecimal sgst = BigDecimal.ZERO;
    private BigDecimal igst = BigDecimal.ZERO;
    @Column(name = "total_inr") private BigDecimal totalInr = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Status status = Status.draft;

    @Column(name = "payment_link_url") private String paymentLinkUrl;
    @Column(name = "pdf_path") private String pdfPath;
    @Column(name = "issued_at") private Instant issuedAt;
    @Column(name = "paid_at") private Instant paidAt;
    @Column(name = "created_at") private Instant createdAt = Instant.now();

    public UUID getId() { return id; }
    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String v) { this.invoiceNumber = v; }
    public Tenant getTenant() { return tenant; }
    public void setTenant(Tenant v) { this.tenant = v; }
    public Subscription getSubscription() { return subscription; }
    public void setSubscription(Subscription v) { this.subscription = v; }
    public Plan getPlan() { return plan; }
    public void setPlan(Plan v) { this.plan = v; }
    public String getRazorpayPaymentId() { return razorpayPaymentId; }
    public void setRazorpayPaymentId(String v) { this.razorpayPaymentId = v; }
    public String getRazorpayOrderId() { return razorpayOrderId; }
    public void setRazorpayOrderId(String v) { this.razorpayOrderId = v; }
    public LocalDate getPeriodStart() { return periodStart; }
    public void setPeriodStart(LocalDate v) { this.periodStart = v; }
    public LocalDate getPeriodEnd() { return periodEnd; }
    public void setPeriodEnd(LocalDate v) { this.periodEnd = v; }
    public String getDescription() { return description; }
    public void setDescription(String v) { this.description = v; }
    public BigDecimal getTaxableAmount() { return taxableAmount; }
    public void setTaxableAmount(BigDecimal v) { this.taxableAmount = v; }
    public BigDecimal getCgst() { return cgst; }
    public void setCgst(BigDecimal v) { this.cgst = v; }
    public BigDecimal getSgst() { return sgst; }
    public void setSgst(BigDecimal v) { this.sgst = v; }
    public BigDecimal getIgst() { return igst; }
    public void setIgst(BigDecimal v) { this.igst = v; }
    public BigDecimal getTotalInr() { return totalInr; }
    public void setTotalInr(BigDecimal v) { this.totalInr = v; }
    public Status getStatus() { return status; }
    public void setStatus(Status v) { this.status = v; }
    public String getPaymentLinkUrl() { return paymentLinkUrl; }
    public void setPaymentLinkUrl(String v) { this.paymentLinkUrl = v; }
    public String getPdfPath() { return pdfPath; }
    public void setPdfPath(String v) { this.pdfPath = v; }
    public Instant getIssuedAt() { return issuedAt; }
    public void setIssuedAt(Instant v) { this.issuedAt = v; }
    public Instant getPaidAt() { return paidAt; }
    public void setPaidAt(Instant v) { this.paidAt = v; }
}
