package com.elanjaibuildos.backend.common.multitenancy;

/**
 * Request-scoped tenant context. Holds the tenant slug (e.g. "acme") and the
 * resolved schema name (e.g. "t_acme"). Set by TenantResolutionFilter /
 * JwtAuthenticationFilter; cleared at end of request.
 */
public final class TenantContext {

    private static final ThreadLocal<String> CURRENT_SLUG = new ThreadLocal<>();
    private static final ThreadLocal<String> CURRENT_SCHEMA = new ThreadLocal<>();
    private static final ThreadLocal<String> CURRENT_STATUS = new ThreadLocal<>();

    private TenantContext() {}

    public static void setTenant(String slug, String schema, String status) {
        CURRENT_SLUG.set(slug);
        CURRENT_SCHEMA.set(schema);
        CURRENT_STATUS.set(status);
    }

    public static String getSlug() { return CURRENT_SLUG.get(); }
    public static String getSchema() { return CURRENT_SCHEMA.get(); }
    public static String getStatus() { return CURRENT_STATUS.get(); }

    /** True when a tenant workspace (not the public/platform realm) is bound. */
    public static boolean hasTenant() { return CURRENT_SCHEMA.get() != null; }

    public static void clear() {
        CURRENT_SLUG.remove();
        CURRENT_SCHEMA.remove();
        CURRENT_STATUS.remove();
    }
}
