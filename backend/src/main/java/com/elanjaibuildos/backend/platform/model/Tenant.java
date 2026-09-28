package com.elanjaibuildos.backend.platform.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tenants")
public class Tenant {

    public enum Status {
        PENDING_APPROVAL, PROVISIONING, PROVISION_FAILED,
        TRIAL, ACTIVE, GRACE, SUSPENDED, CANCELLED, OFFBOARDED
    }

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_name", nullable = false)
    private String companyName;

    @Column(nullable = false, unique = true, length = 30)
    private String slug;

    @Column(name = "schema_name", nullable = false, unique = true, length = 40)
    private String schemaName;

    @Column(name = "owner_name", nullable = false)
    private String ownerName;

    @Column(name = "owner_email", nullable = false)
    private String ownerEmail;

    private String phone;
    private String gstin;
    private String state;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private Status status = Status.PENDING_APPROVAL;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "plan_id")
    private Plan plan;

    @Column(name = "billing_cycle", length = 10)
    private String billingCycle = "monthly";

    @Column(name = "trial_ends_at") private Instant trialEndsAt;
    @Column(name = "current_period_end") private Instant currentPeriodEnd;
    @Column(name = "approved_by") private UUID approvedBy;
    @Column(name = "approved_at") private Instant approvedAt;
    @Column(name = "reject_reason") private String rejectReason;
    @Column(name = "suspended_at") private Instant suspendedAt;
    @Column(name = "cancelled_at") private Instant cancelledAt;
    @Column(name = "offboarded_at") private Instant offboardedAt;
    @Column(name = "deleted_at") private Instant deletedAt;
    @Column(name = "created_at") private Instant createdAt = Instant.now();
    @Column(name = "updated_at") private Instant updatedAt = Instant.now();

    public boolean canLogin() {
        return status == Status.TRIAL || status == Status.ACTIVE || status == Status.GRACE;
    }
    public boolean isReadOnly() { return status == Status.GRACE; }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String v) { this.companyName = v; }
    public String getSlug() { return slug; }
    public void setSlug(String v) { this.slug = v; }
    public String getSchemaName() { return schemaName; }
    public void setSchemaName(String v) { this.schemaName = v; }
    public String getOwnerName() { return ownerName; }
    public void setOwnerName(String v) { this.ownerName = v; }
    public String getOwnerEmail() { return ownerEmail; }
    public void setOwnerEmail(String v) { this.ownerEmail = v; }
    public String getPhone() { return phone; }
    public void setPhone(String v) { this.phone = v; }
    public String getGstin() { return gstin; }
    public void setGstin(String v) { this.gstin = v; }
    public String getState() { return state; }
    public void setState(String v) { this.state = v; }
    public Status getStatus() { return status; }
    public void setStatus(Status v) { this.status = v; this.updatedAt = Instant.now(); }
    public Plan getPlan() { return plan; }
    public void setPlan(Plan v) { this.plan = v; }
    public String getBillingCycle() { return billingCycle; }
    public void setBillingCycle(String v) { this.billingCycle = v; }
    public Instant getTrialEndsAt() { return trialEndsAt; }
    public void setTrialEndsAt(Instant v) { this.trialEndsAt = v; }
    public Instant getCurrentPeriodEnd() { return currentPeriodEnd; }
    public void setCurrentPeriodEnd(Instant v) { this.currentPeriodEnd = v; }
    public UUID getApprovedBy() { return approvedBy; }
    public void setApprovedBy(UUID v) { this.approvedBy = v; }
    public Instant getApprovedAt() { return approvedAt; }
    public void setApprovedAt(Instant v) { this.approvedAt = v; }
    public String getRejectReason() { return rejectReason; }
    public void setRejectReason(String v) { this.rejectReason = v; }
    public Instant getSuspendedAt() { return suspendedAt; }
    public void setSuspendedAt(Instant v) { this.suspendedAt = v; }
    public Instant getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(Instant v) { this.cancelledAt = v; }
    public Instant getOffboardedAt() { return offboardedAt; }
    public void setOffboardedAt(Instant v) { this.offboardedAt = v; }
    public Instant getDeletedAt() { return deletedAt; }
    public void setDeletedAt(Instant v) { this.deletedAt = v; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
