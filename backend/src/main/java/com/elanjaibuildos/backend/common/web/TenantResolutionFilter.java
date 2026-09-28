package com.elanjaibuildos.backend.common.web;

import com.elanjaibuildos.backend.common.multitenancy.TenantContext;
import com.elanjaibuildos.backend.common.multitenancy.TenantSchemaProvisioner;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.sql.DataSource;
import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.Locale;

/**
 * Resolves tenant from subdomain (Host) or dev X-Tenant-ID header.
 * Binds TenantContext for the request; clears in finally.
 * Public paths (/, /api/public/**, /api/admin/**) do not bind a tenant.
 */
@Component
public class TenantResolutionFilter extends OncePerRequestFilter {

    private final DataSource dataSource;
    private final Environment env;

    @Value("${app.tenancy.base-domain:localhost}")
    private String baseDomain;

    @Value("${app.tenancy.admin-host:admin.localhost}")
    private String adminHost;

    @Value("${app.tenancy.dev-header-enabled:true}")
    private boolean devHeaderEnabled;

    public TenantResolutionFilter(DataSource dataSource, Environment env) {
        this.dataSource = dataSource;
        this.env = env;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        try {
            String path = request.getRequestURI();
            if (isPublicPath(path)) { chain.doFilter(request, response); return; }

            String slug = resolveSlug(request);
            if (slug == null) { chain.doFilter(request, response); return; } // platform/public request

            TenantLookup tenant = lookupTenant(slug);
            if (tenant == null) {
                writeJson(response, 404, "WORKSPACE_NOT_FOUND", "Workspace not found.");
                return;
            }
            TenantContext.setTenant(tenant.slug, tenant.schema, tenant.status);
            chain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }

    private boolean isPublicPath(String path) {
        return path == null || path.equals("/")
            || path.startsWith("/api/public/")
            || path.startsWith("/api/admin/")
            || path.startsWith("/api/platform/")
            || path.startsWith("/webhooks/")
            || path.startsWith("/actuator/")
            || path.startsWith("/error");
    }

    /** Subdomain first; dev header fallback only when enabled (dev profile). */
    private String resolveSlug(HttpServletRequest request) {
        String host = request.getHeader("Host");
        if (host == null) host = request.getServerName();
        host = host.toLowerCase(Locale.ROOT).split(":")[0];

        if (host.endsWith("." + baseDomain) && !host.equals(adminHost)) {
            return host.substring(0, host.length() - baseDomain.length() - 1);
        }
        if (devHeaderEnabled) {
            String dev = request.getHeader("X-Tenant-ID");
            if (dev != null && !dev.isBlank()) return dev.trim().toLowerCase(Locale.ROOT);
        }
        return null;
    }

    private record TenantLookup(String slug, String schema, String status) {}

    private TenantLookup lookupTenant(String slug) {
        String sql = "SELECT slug, schema_name, status FROM tenants WHERE slug = ?";
        try (Connection c = dataSource.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, slug);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;
                return new TenantLookup(rs.getString(1), rs.getString(2), rs.getString(3));
            }
        } catch (Exception e) {
            // schema may not be provisioned yet → treat as not found
            return null;
        }
    }

    private void writeJson(HttpServletResponse r, int status, String code, String msg) throws IOException {
        r.setStatus(status);
        r.setContentType("application/json");
        r.getWriter().write("{\"error\":\"" + code + "\",\"message\":\"" + msg + "\"}");
    }
}
