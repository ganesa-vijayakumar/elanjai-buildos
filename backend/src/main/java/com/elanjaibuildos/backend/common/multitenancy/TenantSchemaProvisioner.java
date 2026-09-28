package com.elanjaibuildos.backend.common.multitenancy;

import org.flywaydb.core.Flyway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Set;

/**
 * Provisions a new tenant schema: CREATE SCHEMA t_<slug> + tenant Flyway
 * migrations (db/migration-tenant) + seed. Rolls back on failure.
 */
@Component
public class TenantSchemaProvisioner {

    private static final Logger log = LoggerFactory.getLogger(TenantSchemaProvisioner.class);
    private static final String TENANT_MIGRATION_LOCATION = "classpath:db/migration-tenant";

    /** Schema names are always t_<slug>; validated again at point of use — never trusted upstream. */
    private static final String SCHEMA_PATTERN = "^t_[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$";

    /** Lifecycle states whose tenant data must never be dropped by a provisioning/cleanup path. */
    private static final Set<String> DROP_BLOCKED_STATUSES =
            Set.of("TRIAL", "ACTIVE", "GRACE", "SUSPENDED", "CANCELLED");

    private final DataSource dataSource;
    private final Environment env;

    public TenantSchemaProvisioner(DataSource dataSource, Environment env) {
        this.dataSource = dataSource;
        this.env = env;
    }

    public static String schemaFor(String slug) {
        if (slug == null || !slug.matches("^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$")) {
            throw new IllegalArgumentException("Invalid tenant slug: " + slug);
        }
        return "t_" + slug;
    }

    /** Quoted schema identifier — hyphens are legal in slugs, so the identifier must be quoted. */
    static String quoteIdent(String schema) {
        if (schema == null || !schema.matches(SCHEMA_PATTERN)) {
            throw new IllegalArgumentException("Unsafe tenant schema identifier: " + schema);
        }
        return '"' + schema + '"';
    }

    public boolean schemaExists(String schema) {
        try (Connection c = dataSource.getConnection();
             PreparedStatement ps = c.prepareStatement(
                     "SELECT schema_name FROM information_schema.schemata WHERE schema_name = ?")) {
            ps.setString(1, schema);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        } catch (Exception e) {
            throw new IllegalStateException("Failed checking schema " + schema, e);
        }
    }

    /** Create schema + run tenant migrations. Idempotent: skips CREATE when the schema exists. */
    public void provision(String slug) {
        String schema = schemaFor(slug);
        if (!schemaExists(schema)) {
            try (Connection c = dataSource.getConnection(); Statement s = c.createStatement()) {
                s.execute("CREATE SCHEMA IF NOT EXISTS " + quoteIdent(schema));
            } catch (Exception e) {
                throw new IllegalStateException("CREATE SCHEMA failed for " + schema, e);
            }
        }
        migrate(slug);
    }

    /** Run pending tenant migrations on the schema (catch-up on boot / re-provision). */
    public void migrate(String slug) {
        String schema = schemaFor(slug);
        if (!schemaExists(schema)) {
            log.info("Skipping migrate for {} — schema {} does not exist (purged or never provisioned)", slug, schema);
            return;
        }
        Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .locations(TENANT_MIGRATION_LOCATION)
                .schemas(schema)
                .defaultSchema(schema)
                .createSchemas(false)
                .group(true)
                .load();
        flyway.migrate();
    }

    /**
     * Drop tenant schema entirely (offboarding purge / failed-provisioning cleanup).
     * Hard guard: refuses while the tenant holds a live lifecycle status
     * (TRIAL/ACTIVE/GRACE/SUSPENDED/CANCELLED) — retention purge only runs post-OFFBOARDED.
     */
    public void drop(String slug) {
        String schema = schemaFor(slug);
        assertDroppable(slug, schema);
        try (Connection c = dataSource.getConnection(); Statement s = c.createStatement()) {
            s.execute("DROP SCHEMA IF EXISTS " + quoteIdent(schema) + " CASCADE");
        } catch (Exception e) {
            throw new IllegalStateException("DROP SCHEMA failed for " + schema, e);
        }
    }

    private void assertDroppable(String slug, String schema) {
        String status = null;
        try (Connection c = dataSource.getConnection();
             PreparedStatement ps = c.prepareStatement("SELECT status FROM tenants WHERE slug = ?")) {
            ps.setString(1, slug);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) status = rs.getString(1);
            }
        } catch (SQLException e) {
            throw new IllegalStateException("Drop guard check failed for " + schema, e);
        }
        if (status != null && DROP_BLOCKED_STATUSES.contains(status)) {
            throw new IllegalStateException(
                    "Refusing to drop " + schema + " — tenant is in live status " + status);
        }
    }

    /** Re-run tenant migrations on every existing tenant schema (boot-time catch-up). */
    public int migrateAllTenants() {
        int migrated = 0;
        try (Connection c = dataSource.getConnection();
             Statement s = c.createStatement();
             ResultSet rs = s.executeQuery(
                     "SELECT slug FROM tenants WHERE schema_name IS NOT NULL AND status <> 'OFFBOARDED'")) {
            java.util.List<String> slugs = new java.util.ArrayList<>();
            while (rs.next()) slugs.add(rs.getString(1));
            for (String slug : slugs) { migrate(slug); migrated++; }
        } catch (Exception e) {
            throw new IllegalStateException("Tenant migration catch-up failed", e);
        }
        return migrated;
    }
}
