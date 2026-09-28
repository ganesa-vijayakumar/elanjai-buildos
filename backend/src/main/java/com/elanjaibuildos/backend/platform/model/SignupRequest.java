package com.elanjaibuildos.backend.platform.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "signup_requests")
public class SignupRequest {

    public enum Status { PENDING, APPROVED, REJECTED, PROVISIONED, PROVISION_FAILED }

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_name", nullable = false) private String companyName;
    @Column(name = "owner_name", nullable = false) private String ownerName;
    @Column(nullable = false, length = 190) private String email;
    private String phone;
    @Column(name = "password_hash", nullable = false) private String passwordHash;
    @Column(nullable = false, length = 30) private String slug;
    private String gstin;
    private String state;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "plan_id")
    private Plan plan;

    @Column(name = "billing_cycle", length = 10) private String billingCycle = "monthly";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private Status status = Status.PENDING;

    @Column(name = "email_verified") private Boolean emailVerified = false;
    @Column(name = "verify_token") private String verifyToken;
    @Column(name = "reviewed_by") private UUID reviewedBy;
    @Column(name = "reviewed_at") private Instant reviewedAt;
    @Column(name = "reject_reason") private String rejectReason;
    @Column(name = "created_at") private Instant createdAt = Instant.now();

    public UUID getId() { return id; }
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String v) { this.companyName = v; }
    public String getOwnerName() { return ownerName; }
    public void setOwnerName(String v) { this.ownerName = v; }
    public String getEmail() { return email; }
    public void setEmail(String v) { this.email = v; }
    public String getPhone() { return phone; }
    public void setPhone(String v) { this.phone = v; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String v) { this.passwordHash = v; }
    public String getSlug() { return slug; }
    public void setSlug(String v) { this.slug = v; }
    public String getGstin() { return gstin; }
    public void setGstin(String v) { this.gstin = v; }
    public String getState() { return state; }
    public void setState(String v) { this.state = v; }
    public Plan getPlan() { return plan; }
    public void setPlan(Plan v) { this.plan = v; }
    public String getBillingCycle() { return billingCycle; }
    public void setBillingCycle(String v) { this.billingCycle = v; }
    public Status getStatus() { return status; }
    public void setStatus(Status v) { this.status = v; }
    public Boolean getEmailVerified() { return emailVerified; }
    public void setEmailVerified(Boolean v) { this.emailVerified = v; }
    public String getVerifyToken() { return verifyToken; }
    public void setVerifyToken(String v) { this.verifyToken = v; }
    public UUID getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(UUID v) { this.reviewedBy = v; }
    public Instant getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(Instant v) { this.reviewedAt = v; }
    public String getRejectReason() { return rejectReason; }
    public void setRejectReason(String v) { this.rejectReason = v; }
    public Instant getCreatedAt() { return createdAt; }
}
