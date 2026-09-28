package com.elanjaibuildos.backend.common.web;

import com.elanjaibuildos.backend.common.multitenancy.TenantContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;
import com.elanjaibuildos.backend.platform.domain.Subscription;
import com.elanjaibuildos.backend.platform.domain.Tenant;

/**
 * Tenant lifecycle enforcement (D-013/D-037):
 *  - SUSPENDED / CANCELLED / OFFBOARDED tenants → all API writes+reads blocked (login itself is rejected earlier)
 *  - GRACE tenants → read-only: GET/HEAD allowed, writes → 402-style 403 TENANT_READ_ONLY
 * Applies only when a tenant is bound to the request.
 */
@Component
public class TenantLifecycleGuardFilter extends OncePerRequestFilter {

    private static final Set<String> BLOCKED = Set.of(
            "SUSPENDED", "CANCELLED", "OFFBOARDED", "PROVISIONING", "PROVISION_FAILED", "PENDING_APPROVAL");

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String status = TenantContext.getStatus();
        if (status == null) { chain.doFilter(request, response); return; }

        if (BLOCKED.contains(status)) {
            write(response, 403, "TENANT_INACTIVE",
                    "This workspace is " + status.toLowerCase().replace('_', ' ') + ". Contact support.");
            return;
        }
        if ("GRACE".equals(status) && isWrite(request.getMethod()) && !isGraceAllowed(request.getRequestURI())) {
            write(response, 403, "TENANT_READ_ONLY",
                    "Subscription grace period — workspace is read-only. Pay the outstanding invoice to restore full access.");
            return;
        }
        chain.doFilter(request, response);
    }

    /** Writes a GRACE tenant still needs: login (to reach the read-only UI) and billing (to pay its way out). */
    private boolean isGraceAllowed(String uri) {
        return uri.startsWith("/api/auth/login") || uri.startsWith("/api/auth/authenticate")
            || uri.startsWith("/api/billing/");
    }

    private boolean isWrite(String method) {
        return "POST".equals(method) || "PUT".equals(method)
             || "PATCH".equals(method) || "DELETE".equals(method);
    }

    private void write(HttpServletResponse r, int status, String code, String msg) throws IOException {
        r.setStatus(status);
        r.setContentType("application/json");
        r.getWriter().write("{\"error\":\"" + code + "\",\"message\":\"" + msg + "\"}");
    }
}
