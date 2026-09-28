package com.elanjaibuildos.backend.common.multitenancy;

import org.flywaydb.core.Flyway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import com.elanjaibuildos.backend.platform.domain.Tenant;

/**
 * Provisions a new tenant schema: CREATE SCHEMA t_<slug> + tenant Flyway
 * migrations (db/migration-tenant) + seed. Rolls back on failure.
 */
@Component
public class TenantSchemaProvisioner {

    private static final Logger log = LoggerFactory.getLogger(TenantSchemaProvisioner.class);
    private static final String TENANT_MIGRATION_LOCATION = "classpath:db/migration-tenant";
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

    public boolean schemaExists(String schema) {
        try (Connection c = dataSource.getConnection();
             Statement s = c.createStatement();
             ResultSet rs = s.executeQuery(
                     "SELECT schema_name FROM information_schema.schemata WHERE schema_name='" + schema + "'")) {
            return rs.next();
        } catch (Exception e) {
            throw new IllegalStateException("Failed checking schema " + schema, e);
        }
    }

    /** Create schema + run tenant migrations. Idempotent: skips if schema exists. */
    public void provision(String slug) {
        String schema = schemaFor(slug);
        if (!schemaExists(schema)) {
            try (Connection c = dataSource.getConnection(); Statement s = c.createStatement()) {
                s.execute("CREATE SCHEMA " + schema);
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

    /** Drop tenant schema entirely (offboarding / failed provisioning cleanup). */
    public void drop(String slug) {
        String schema = schemaFor(slug);
        try (Connection c = dataSource.getConnection(); Statement s = c.createStatement()) {
            s.execute("DROP SCHEMA IF EXISTS " + schema + " CASCADE");
        } catch (Exception e) {
            throw new IllegalStateException("DROP SCHEMA failed for " + schema, e);
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
