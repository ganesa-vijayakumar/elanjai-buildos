package com.elanjaibuildos.backend.platform.service;

import com.elanjaibuildos.backend.common.multitenancy.TenantContext;
import com.elanjaibuildos.backend.platform.model.Tenant;
import com.elanjaibuildos.backend.platform.model.UsageCounter;
import com.elanjaibuildos.backend.platform.repository.TenantRepository;
import org.springframework.stereotype.Component;

/**
 * Plan-limit + feature-gate enforcement callable from tenant-schema operations.
 * `tenants`/`plans`/`usage_counters` exist only in public — resolved via the
 * tenant search_path's public fallback.
 */
@Component
public class PlatformGuard {

    private final TenantRepository tenants;
    private final UsageService usage;

    public PlatformGuard(TenantRepository tenants, UsageService usage) {
        this.tenants = tenants;
        this.usage = usage;
    }

    public static class FeatureLocked extends RuntimeException {
        public final String feature;
        public FeatureLocked(String feature) {
            super("Feature '" + feature + "' is not available on your plan. Upgrade to continue.");
            this.feature = feature;
        }
    }

    public Tenant currentTenant() {
        String slug = TenantContext.getSlug();
        return slug == null ? null : tenants.findBySlug(slug).orElse(null);
    }

    /** Enforce plan feature flag; throws FeatureLocked → 403 FEATURE_LOCKED. */
    public void requireFeature(String feature) {
        Tenant t = currentTenant();
        if (t == null || t.getPlan() == null || !t.getPlan().featureEnabled(feature)) {
            throw new FeatureLocked(feature);
        }
    }

    /** Enforce + increment usage metric against the plan cap (-1 = unlimited). */
    public void checkAndIncrement(String metric) {
        Tenant t = currentTenant();
        if (t == null || t.getPlan() == null) return;
        long limit = switch (metric) {
            case UsageCounter.M_PROJECTS -> t.getPlan().getMaxProjects();
            case UsageCounter.M_STAFF_USERS -> t.getPlan().getMaxStaffUsers();
            case UsageCounter.M_QUOTATIONS_MONTH -> t.getPlan().getMaxQuotationsPerMonth();
            default -> -1;
        };
        usage.incrementChecked(t, metric, limit);
    }

    /** Recount absolute counters (projects, staff) after mutations. */
    public void recount(String metric, long absoluteValue) {
        Tenant t = currentTenant();
        if (t != null) usage.set(t.getId(), metric, absoluteValue);
    }
}
