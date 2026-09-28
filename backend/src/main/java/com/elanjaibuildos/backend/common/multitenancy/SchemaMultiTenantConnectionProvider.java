package com.elanjaibuildos.backend.common.multitenancy;

import org.hibernate.engine.jdbc.connections.spi.MultiTenantConnectionProvider;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * Schema-per-tenant provider: each checkout points the connection's
 * search_path at the tenant schema first, then public (so platform tables
 * remain reachable without cross-tenant exposure).
 */
@Component
public class SchemaMultiTenantConnectionProvider implements MultiTenantConnectionProvider<String> {

    /** Mirrors the slug rules enforced at signup/provisioning: t_<slug>. */
    private static final String SCHEMA_PATTERN = "^t_[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$";

    private final DataSource dataSource;

    public SchemaMultiTenantConnectionProvider(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    /** Fail closed unless the identifier is exactly t_<valid-slug>; quotes it for hyphenated names. */
    static String quotedSchema(String schema) {
        if (schema == null || !schema.matches(SCHEMA_PATTERN)) {
            throw new IllegalArgumentException("Unsafe tenant schema identifier: " + schema);
        }
        return '"' + schema + '"';
    }

    @Override
    public Connection getAnyConnection() throws SQLException {
        return dataSource.getConnection();
    }

    @Override
    public void releaseAnyConnection(Connection connection) throws SQLException {
        connection.close();
    }

    @Override
    public Connection getConnection(String schema) throws SQLException {
        Connection connection = dataSource.getConnection();
        try (Statement stmt = connection.createStatement()) {
            stmt.execute("SET search_path TO " + quotedSchema(schema) + ", public");
        } catch (SQLException | RuntimeException e) {
            connection.close();
            throw e;
        }
        return connection;
    }

    @Override
    public void releaseConnection(String schema, Connection connection) throws SQLException {
        try {
            try (Statement stmt = connection.createStatement()) {
                stmt.execute("SET search_path TO public");
            }
        } finally {
            connection.close();
        }
    }

    @Override
    public boolean supportsAggressiveRelease() { return false; }

    @Override
    public boolean isUnwrappableAs(Class<?> unwrapType) { return false; }

    @Override
    public <T> T unwrap(Class<T> unwrapType) { return null; }
}
