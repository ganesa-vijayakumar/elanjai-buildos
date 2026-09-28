package com.elanjaibuildos.backend.platform.service;

import com.elanjaibuildos.backend.platform.model.Plan;
import com.elanjaibuildos.backend.platform.model.Tenant;
import com.elanjaibuildos.backend.platform.model.UsageCounter;
import com.elanjaibuildos.backend.platform.repository.UsageCounterRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.YearMonth;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Usage metering + hard plan-limit enforcement (D-026, F-021).
 * Throws PlanLimitExceeded → mapped to 403 PLAN_LIMIT at the web layer.
 */
@Service
public class UsageService {

    private final UsageCounterRepository counters;

    public UsageService(UsageCounterRepository counters) {
        this.counters = counters;
    }

    public static class PlanLimitExceeded extends RuntimeException {
        public final String metric; public final long used; public final long limit;
        public PlanLimitExceeded(String metric, long used, long limit) {
            super("Plan limit reached for " + metric + " (" + used + "/" + limit + ")");
            this.metric = metric; this.used = used; this.limit = limit;
        }
    }

    private static String monthKey() { return YearMonth.now().toString(); } // YYYY-MM

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public long get(UUID tenantId, String metric) {
        String pk = UsageCounter.M_QUOTATIONS_MONTH.equals(metric) ? monthKey() : "";
        return counters.findByTenantIdAndMetricAndPeriodKey(tenantId, metric, pk)
                .map(UsageCounter::getValue).orElse(0L);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void set(UUID tenantId, String metric, long value) {
        String pk = UsageCounter.M_QUOTATIONS_MONTH.equals(metric) ? monthKey() : "";
        UsageCounter c = counters.findByTenantIdAndMetricAndPeriodKey(tenantId, metric, pk)
                .orElseGet(() -> {
                    UsageCounter n = new UsageCounter();
                    n.setTenantId(tenantId); n.setMetric(metric); n.setPeriodKey(pk);
                    return n;
                });
        c.setValue(value);
        counters.save(c);
    }

    /** Increment and enforce the plan cap. -1 plan limit = unlimited. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void incrementChecked(Tenant tenant, String metric, long planLimit) {
        if (planLimit < 0) { increment(tenant.getId(), metric); return; }
        long current = get(tenant.getId(), metric);
        if (current >= planLimit) throw new PlanLimitExceeded(metric, current, planLimit);
        increment(tenant.getId(), metric);
    }

    public void increment(UUID tenantId, String metric) {
        set(tenantId, metric, get(tenantId, metric) + 1);
    }

    public void decrement(UUID tenantId, String metric) {
        long v = get(tenantId, metric);
        if (v > 0) set(tenantId, metric, v - 1);
    }

    /** Enforce only (read current vs plan limit) without incrementing. */
    public void check(Tenant tenant, String metric, long planLimit) {
        if (planLimit < 0) return;
        long current = get(tenant.getId(), metric);
        if (current >= planLimit) throw new PlanLimitExceeded(metric, current, planLimit);
    }

    public Map<String, Object> snapshot(Tenant tenant) {
        Plan p = tenant.getPlan();
        Map<String, Object> m = new HashMap<>();
        m.put("staff_users", Map.of("used", get(tenant.getId(), UsageCounter.M_STAFF_USERS),
                "limit", p != null ? p.getMaxStaffUsers() : 0));
        m.put("projects", Map.of("used", get(tenant.getId(), UsageCounter.M_PROJECTS),
                "limit", p != null ? p.getMaxProjects() : 0));
        m.put("quotations_month", Map.of("used", get(tenant.getId(), UsageCounter.M_QUOTATIONS_MONTH),
                "limit", p != null ? p.getMaxQuotationsPerMonth() : 0));
        m.put("storage_mb", Map.of("used", get(tenant.getId(), UsageCounter.M_STORAGE_MB),
                "limit", p != null ? (long) p.getStorageGb() * 1024 : 0));
        return m;
    }
}
