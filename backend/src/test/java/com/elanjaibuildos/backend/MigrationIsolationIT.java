package com.elanjaibuildos.backend;

import com.elanjaibuildos.backend.common.multitenancy.TenantContext;
import com.elanjaibuildos.backend.platform.domain.Tenant;
import org.junit.jupiter.api.Test;

import java.sql.Statement;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tenant-track migration runner isolation (02-tenancy/02 Phase B):
 * one broken schema must not block or fail the others — the runner returns a
 * per-schema report instead.
 */
class MigrationIsolationIT extends TenancyITSupport {

    private static final String GOOD = "it-good";
    private static final String BAD = "it-bad";

    @Test
    void oneBrokenSchemaDoesNotBlockOthers() throws Exception {
        provisionTenant(GOOD, "owner@it-good.test");

        // fabricate a tenant whose schema is broken for Flyway: a table exists
        // but there is no flyway_schema_history — migrate must fail for it alone
        Tenant bad = new Tenant();
        bad.setCompanyName("Broken Co");
        bad.setSlug(BAD);
        bad.setSchemaName("t_" + BAD);
        bad.setOwnerName("Broken Owner");
        bad.setOwnerEmail("owner@it-bad.test");
        bad.setStatus(Tenant.Status.PROVISIONING);
        tenants.save(bad);
        trackForCleanup(BAD);

        try (var c = dataSource.getConnection(); Statement s = c.createStatement()) {
            s.execute("CREATE SCHEMA \"t_it-bad\"");
            s.execute("CREATE TABLE \"t_it-bad\".users (id int primary key)");
        }

        var report = provisioner.migrateAllTenants();

        assertTrue(report.migrated().contains(GOOD),
                "good tenant should migrate: " + report.migrated());
        assertTrue(report.failed().containsKey(BAD),
                "broken tenant should appear in the failure report: " + report.failed());
        assertFalse(report.migrated().contains(BAD));
    }
}
