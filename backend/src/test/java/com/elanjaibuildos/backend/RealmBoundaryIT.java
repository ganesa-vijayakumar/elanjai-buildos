package com.elanjaibuildos.backend;

import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Realm boundary enforcement (JwtAuthenticationFilter):
 * platform tokens stay on /api/admin|platform, tenant tokens need a matching
 * resolved tenant context, unknown realms never authenticate.
 */
class RealmBoundaryIT extends TenancyITSupport {

    @Test
    void platformTokenReachesAdminSurface() throws Exception {
        mvc.perform(get("/api/admin/tenants")
                        .header("Host", "admin.localhost")
                        .header("Authorization", "Bearer " + platformToken()))
                .andExpect(status().isOk());
    }

    @Test
    void platformTokenRejectedOnTenantEndpoints() throws Exception {
        mvc.perform(get("/api/sites")
                        .header("Host", "localhost")
                        .header("Authorization", "Bearer " + platformToken()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("REALM_MISMATCH"));
    }

    @Test
    void tenantTokenRejectedOnPlatformEndpoints() throws Exception {
        String token = tenantToken("owner@acme.test", "acme", "OWNER");
        mvc.perform(get("/api/admin/tenants")
                        .header("Host", "admin.localhost")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("REALM_MISMATCH"));
    }

    @Test
    void tenantTokenWithoutResolvedTenantIsRejected() throws Exception {
        // apex host, dev header disabled → no TenantContext → fail closed
        String token = tenantToken("owner@acme.test", "acme", "OWNER");
        mvc.perform(get("/api/sites")
                        .header("Host", "localhost")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("NO_TENANT_CONTEXT"));
    }

    @Test
    void unknownWorkspaceHostReturns404() throws Exception {
        String token = tenantToken("owner@ghost.test", "ghost-x", "OWNER");
        mvc.perform(get("/api/sites")
                        .header("Host", "ghost-x.localhost")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("WORKSPACE_NOT_FOUND"));
    }

    @Test
    void actionTokensNeverAuthenticate() throws Exception {
        String action = jwt.generateActionToken("owner@acme.test", "password-reset", 60_000);
        mvc.perform(get("/api/auth/me")
                        .header("Host", "localhost")
                        .header("Authorization", "Bearer " + action))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void malformedTokenIsUnauthorized() throws Exception {
        mvc.perform(get("/api/sites")
                        .header("Host", "localhost")
                        .header("Authorization", "Bearer not-a-jwt"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void unauthenticatedRequestIsRejected() throws Exception {
        mvc.perform(get("/api/sites").header("Host", "localhost"))
                .andExpect(status().is4xxClientError());
    }
}
