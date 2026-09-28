package com.elanjaibuildos.backend.security;

import com.elanjaibuildos.backend.common.multitenancy.TenantContext;
import com.elanjaibuildos.backend.platform.domain.PlatformUser;
import com.elanjaibuildos.backend.platform.repository.PlatformUserRepository;
import com.elanjaibuildos.backend.identity.repository.UserRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * Authenticates Bearer tokens for both realms:
 *  - platform tokens authenticate against platform_users (public schema)
 *  - tenant tokens must carry a `tenant` claim matching the resolved host slug
 *    (cross-tenant token replay → 403-equivalent rejection)
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final PlatformUserRepository platformUserRepository;

    public JwtAuthenticationFilter(JwtService jwtService, UserRepository userRepository,
                                   PlatformUserRepository platformUserRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.platformUserRepository = platformUserRepository;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        try {
            Claims claims = jwtService.parse(header.substring(7));
            if (jwtService.isExpired(claims)) { deny(response); return; }

            String realm = claims.get("realm", String.class);
            String email = claims.getSubject();
            String role = claims.get("role", String.class);

            if (JwtService.REALM_PLATFORM.equals(realm)) {
                authenticatePlatform(request, email, role);
            } else if (JwtService.REALM_TENANT.equals(realm)) {
                String tokenTenant = claims.get("tenant", String.class);
                String ctxSlug = TenantContext.getSlug();
                // token tenant must match host/header-resolved tenant
                if (tokenTenant == null || !tokenTenant.equals(ctxSlug)) {
                    writeForbidden(response, "TENANT_MISMATCH", "Token does not belong to this workspace.");
                    return;
                }
                authenticateTenant(request, email, role);
            }
        } catch (io.jsonwebtoken.JwtException | IllegalArgumentException e) {
            deny(response);
            return;
        }

        chain.doFilter(request, response);
    }

    private void authenticatePlatform(HttpServletRequest request, String email, String role) {
        platformUserRepository.findByEmail(email)
                .filter(u -> Boolean.TRUE.equals(u.getActive()))
                .ifPresent(u -> setAuth(request, email, "ROLE_" + u.getRole().name(), Map.of(
                        "realm", "platform", "userId", u.getId().toString())));
    }

    private void authenticateTenant(HttpServletRequest request, String email, String role) {
        userRepository.findByEmail(email)
                .filter(u -> "active".equals(u.getStatus()))
                .ifPresent(u -> setAuth(request, email, "ROLE_" + u.getRole().name(), Map.of(
                        "realm", "tenant",
                        "tenant", TenantContext.getSlug() != null ? TenantContext.getSlug() : "",
                        "userId", u.getId().toString())));
    }

    private void setAuth(HttpServletRequest request, String principal, String authority,
                         Map<String, String> details) {
        var auth = new UsernamePasswordAuthenticationToken(
                principal, null, List.of(new SimpleGrantedAuthority(authority)));
        auth.setDetails(details);
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    private void deny(HttpServletResponse r) throws IOException {
        r.setStatus(401);
        r.setContentType("application/json");
        r.getWriter().write("{\"error\":\"UNAUTHORIZED\",\"message\":\"Invalid or expired token.\"}");
    }

    private void writeForbidden(HttpServletResponse r, String code, String msg) throws IOException {
        r.setStatus(403);
        r.setContentType("application/json");
        r.getWriter().write("{\"error\":\"" + code + "\",\"message\":\"" + msg + "\"}");
    }
}
