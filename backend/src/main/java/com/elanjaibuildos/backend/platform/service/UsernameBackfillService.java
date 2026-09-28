package com.elanjaibuildos.backend.platform.service;

import com.elanjaibuildos.backend.common.multitenancy.TenantContext;
import com.elanjaibuildos.backend.identity.domain.User;
import com.elanjaibuildos.backend.identity.repository.UserRepository;
import com.elanjaibuildos.backend.identity.service.UsernameService;
import com.elanjaibuildos.backend.platform.domain.Tenant;
import com.elanjaibuildos.backend.platform.repository.TenantRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.PlatformTransactionManager;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Controlled per-tenant username backfill (02-tenancy/01).
 *
 * Runs per tenant with the slug in hand — Flyway SQL cannot know it. For each
 * user with username NULL it derives the canonical {@code <local>@<slug>} from
 * the email local-part in deterministic order (created_at, id). A candidate
 * that collides with ANY stored email (including the row's own) or an existing
 * username is skipped: the row stays NULL and is counted as flagged for review.
 * Idempotent — never overwrites a non-NULL username; a re-run is a no-op.
 */
@Service
public class UsernameBackfillService {

    private static final Logger log = LoggerFactory.getLogger(UsernameBackfillService.class);

    /** scanned = users with username NULL seen; assigned = canonical set; flagged = skipped for review. */
    public record Report(String slug, int scanned, int assigned, int flagged) {}

    private final TenantRepository tenants;
    private final UserRepository users;
    private final UsernameService usernames;
    private final AuditService audit;
    private final TransactionTemplate txTemplate;

    public UsernameBackfillService(TenantRepository tenants, UserRepository users,
                                   UsernameService usernames, AuditService audit,
                                   PlatformTransactionManager txManager) {
        this.tenants = tenants; this.users = users; this.usernames = usernames;
        this.audit = audit;
        this.txTemplate = new TransactionTemplate(txManager);
    }

    /** Backfill every provisioned, non-offboarded tenant; per-tenant failures are isolated. */
    public List<Report> backfillAll() {
        List<Report> reports = new ArrayList<>();
        for (Tenant t : tenants.findAll()) {
            if (t.getSchemaName() == null || t.getStatus() == Tenant.Status.OFFBOARDED) continue;
            try {
                reports.add(backfillTenant(t.getSlug()));
            } catch (Exception e) {
                log.error("Username backfill failed for tenant {}", t.getSlug(), e);
                reports.add(new Report(t.getSlug(), -1, -1, -1));
            }
        }
        return reports;
    }

    public Report backfillTenant(String slug) {
        Tenant t = tenants.findBySlug(slug)
                .orElseThrow(() -> new IllegalArgumentException("Unknown tenant: " + slug));
        if (t.getSchemaName() == null) {
            return new Report(slug, 0, 0, 0);
        }
        TenantContext.setTenant(t.getSlug(), t.getSchemaName(), t.getStatus().name());
        final Report report;
        try {
            report = txTemplate.execute(s -> {
                int assigned = 0, flagged = 0;
                List<User> pending = users.findByUsernameIsNullOrderByCreatedAtAscIdAsc();
                for (User u : pending) {
                    if (usernames.assignDerived(u, slug) != null) {
                        users.save(u);
                        assigned++;
                    } else {
                        flagged++;
                    }
                }
                return new Report(slug, pending.size(), assigned, flagged);
            });
        } finally {
            TenantContext.clear();
        }
        // audit write happens AFTER the tenant context is cleared — the platform
        // audit log lives in the public schema, not inside t_<slug>.
        audit.logSystem("username-backfill", "tenant", slug,
                Map.of("scanned", report.scanned(), "assigned", report.assigned(),
                        "flagged", report.flagged()));
        log.info("Username backfill for {}: scanned={} assigned={} flagged={}",
                slug, report.scanned(), report.assigned(), report.flagged());
        return report;
    }

    /** Serialisable summary for the admin API. */
    public static Map<String, Object> toMap(Report r) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("slug", r.slug());
        m.put("scanned", r.scanned());
        m.put("assigned", r.assigned());
        m.put("flagged", r.flagged());
        return m;
    }
}
