package com.elanjaibuildos.backend.platform.model;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "plans")
public class Plan {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 40)
    private String code;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(name = "price_monthly_inr", nullable = false)
    private Integer priceMonthlyInr;

    @Column(name = "price_yearly_inr", nullable = false)
    private Integer priceYearlyInr;

    @Column(name = "max_projects", nullable = false)
    private Integer maxProjects;          // -1 = unlimited

    @Column(name = "max_staff_users", nullable = false)
    private Integer maxStaffUsers;

    @Column(name = "max_quotations_per_month", nullable = false)
    private Integer maxQuotationsPerMonth;

    @Column(name = "storage_gb", nullable = false)
    private Integer storageGb;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "feature_flags", columnDefinition = "jsonb")
    private Map<String, Object> featureFlags = Map.of();

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    @Column(name = "created_at") private Instant createdAt = Instant.now();
    @Column(name = "updated_at") private Instant updatedAt = Instant.now();

    public boolean featureEnabled(String flag) {
        Object v = featureFlags == null ? null : featureFlags.get(flag);
        return Boolean.TRUE.equals(v);
    }

    public UUID getId() { return id; }
    public String getCode() { return code; }
    public void setCode(String v) { this.code = v; }
    public String getName() { return name; }
    public void setName(String v) { this.name = v; }
    public Integer getPriceMonthlyInr() { return priceMonthlyInr; }
    public void setPriceMonthlyInr(Integer v) { this.priceMonthlyInr = v; }
    public Integer getPriceYearlyInr() { return priceYearlyInr; }
    public void setPriceYearlyInr(Integer v) { this.priceYearlyInr = v; }
    public Integer getMaxProjects() { return maxProjects; }
    public void setMaxProjects(Integer v) { this.maxProjects = v; }
    public Integer getMaxStaffUsers() { return maxStaffUsers; }
    public void setMaxStaffUsers(Integer v) { this.maxStaffUsers = v; }
    public Integer getMaxQuotationsPerMonth() { return maxQuotationsPerMonth; }
    public void setMaxQuotationsPerMonth(Integer v) { this.maxQuotationsPerMonth = v; }
    public Integer getStorageGb() { return storageGb; }
    public void setStorageGb(Integer v) { this.storageGb = v; }
    public Map<String, Object> getFeatureFlags() { return featureFlags; }
    public void setFeatureFlags(Map<String, Object> v) { this.featureFlags = v; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean v) { this.isActive = v; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer v) { this.sortOrder = v; }
}
