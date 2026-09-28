package com.elanjaibuildos.backend.platform.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "subscriptions")
public class Subscription {

    public enum Status { PENDING, ACTIVE, PAST_DUE, CANCELLED, EXPIRED }

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "plan_id", nullable = false)
    private Plan plan;

    @Column(name = "razorpay_subscription_id") private String razorpaySubscriptionId;
    @Column(name = "razorpay_customer_id") private String razorpayCustomerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private Status status = Status.PENDING;

    @Column(name = "billing_cycle", length = 10) private String billingCycle = "monthly";
    @Column(name = "current_period_start") private Instant currentPeriodStart;
    @Column(name = "current_period_end") private Instant currentPeriodEnd;
    @Column(name = "cancel_at_period_end") private Boolean cancelAtPeriodEnd = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scheduled_plan_id")
    private Plan scheduledPlan;   // downgrade takes effect at renewal (D-051)

    @Column(name = "created_at") private Instant createdAt = Instant.now();
    @Column(name = "updated_at") private Instant updatedAt = Instant.now();

    public UUID getId() { return id; }
    public Tenant getTenant() { return tenant; }
    public void setTenant(Tenant v) { this.tenant = v; }
    public Plan getPlan() { return plan; }
    public void setPlan(Plan v) { this.plan = v; }
    public String getRazorpaySubscriptionId() { return razorpaySubscriptionId; }
    public void setRazorpaySubscriptionId(String v) { this.razorpaySubscriptionId = v; }
    public String getRazorpayCustomerId() { return razorpayCustomerId; }
    public void setRazorpayCustomerId(String v) { this.razorpayCustomerId = v; }
    public Status getStatus() { return status; }
    public void setStatus(Status v) { this.status = v; this.updatedAt = Instant.now(); }
    public String getBillingCycle() { return billingCycle; }
    public void setBillingCycle(String v) { this.billingCycle = v; }
    public Instant getCurrentPeriodStart() { return currentPeriodStart; }
    public void setCurrentPeriodStart(Instant v) { this.currentPeriodStart = v; }
    public Instant getCurrentPeriodEnd() { return currentPeriodEnd; }
    public void setCurrentPeriodEnd(Instant v) { this.currentPeriodEnd = v; }
    public Boolean getCancelAtPeriodEnd() { return cancelAtPeriodEnd; }
    public void setCancelAtPeriodEnd(Boolean v) { this.cancelAtPeriodEnd = v; }
    public Plan getScheduledPlan() { return scheduledPlan; }
    public void setScheduledPlan(Plan v) { this.scheduledPlan = v; }
}
