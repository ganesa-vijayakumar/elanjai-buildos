package com.elanjaibuildos.backend.platform.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "usage_counters",
       uniqueConstraints = @UniqueConstraint(columnNames = {"tenant_id", "metric", "period_key"}))
public class UsageCounter {

    public static final String M_STAFF_USERS = "staff_users";
    public static final String M_PROJECTS = "projects";
    public static final String M_QUOTATIONS_MONTH = "quotations_month";
    public static final String M_STORAGE_MB = "storage_mb";

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false, length = 32)
    private String metric;

    @Column(name = "period_key", length = 10)
    private String periodKey = "";

    @Column(nullable = false)
    private Long value = 0L;

    @Column(name = "updated_at") private Instant updatedAt = Instant.now();

    public UUID getId() { return id; }
    public UUID getTenantId() { return tenantId; }
    public void setTenantId(UUID v) { this.tenantId = v; }
    public String getMetric() { return metric; }
    public void setMetric(String v) { this.metric = v; }
    public String getPeriodKey() { return periodKey; }
    public void setPeriodKey(String v) { this.periodKey = v; }
    public Long getValue() { return value; }
    public void setValue(Long v) { this.value = v; this.updatedAt = Instant.now(); }
}
