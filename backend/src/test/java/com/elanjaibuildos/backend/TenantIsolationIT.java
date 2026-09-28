package com.elanjaibuildos.backend;

import com.elanjaibuildos.backend.common.multitenancy.TenantContext;
import com.elanjaibuildos.backend.platform.domain.Tenant;
import org.junit.jupiter.api.Test;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Schema-per-tenant isolation: host-derived context + matching JWT claim,
 * schema separation of data, safe quoting of hyphenated slugs, connection
 * search_path reset, idempotent approve, and the workspace-status surface.
 */
class TenantIsolationIT extends TenancyITSupport {

    private static final String ALPHA = "it-alpha";
    private static final String BETA = "it-beta";
    private static final String SHOPX = "it-shop-x"; // hyphenated: exercises quoted identifiers
    private static final String ALPHA_EMAIL = "owner@it-alpha.test";
    private static final String BETA_EMAIL = "owner@it-beta.test";

    @Test
    void hyphenatedTenantProvisionsLoginAndIsolates() throws Exception {
        provisionTenant(ALPHA, ALPHA_EMAIL);
        provisionTenant(SHOPX, "owner@it-shop-x.test");

        // owner can log in on its own host
        String token = login(ALPHA, ALPHA_EMAIL);
        assertNotNull(token);

        // token is usable on the matching host
        mvc.perform(get("/api/sites")
                        .header("Host", ALPHA + ".localhost")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // ...and rejected on the other tenant's host (no cross-tenant replay)
        mvc.perform(get("/api/sites")
                        .header("Host", SHOPX + ".localhost")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("TENANT_MISMATCH"));

        // platform token on a real tenant host is still a realm violation
        mvc.perform(get("/api/sites")
                        .header("Host", ALPHA + ".localhost")
                        .header("Authorization", "Bearer " + platformToken()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("REALM_MISMATCH"));

        // schema separation: the owner row exists in t_it-alpha but not t_it-shop-x
        TenantContext.setTenant(ALPHA, "t_it-alpha", "TRIAL");
        assertTrue(users.findByEmail(ALPHA_EMAIL).isPresent());
        TenantContext.clear();
        TenantContext.setTenant(SHOPX, "t_it-shop-x", "TRIAL");
        assertTrue(users.findByEmail(ALPHA_EMAIL).isEmpty());
        TenantContext.clear();
    }

    @Test
    void approveIsIdempotentAndResumable() throws Exception {
        provisionTenant(ALPHA, ALPHA_EMAIL);
        TenantContext.clear();

        UUID signupId = signups.findTopBySlugOrderByCreatedAtDesc(ALPHA).orElseThrow().getId();
        UUID tenantId = tenants.findBySlug(ALPHA).orElseThrow().getId();

        // duplicate approve → same tenant, no duplicate rows, no error
        Tenant again = signupService.approve(signupId, null);
        assertEquals(tenantId, again.getId());
        assertEquals(1, tenants.findAll().stream().filter(t -> ALPHA.equals(t.getSlug())).count());

        // simulated partial failure: force PROVISION_FAILED, then resume
        Tenant t = tenants.findBySlug(ALPHA).orElseThrow();
        t.setStatus(Tenant.Status.PROVISION_FAILED);
        tenants.save(t);
        var req = signups.findById(signupId).orElseThrow();
        req.setStatus(com.elanjaibuildos.backend.platform.domain.SignupRequest.Status.PROVISION_FAILED);
        signups.save(req);

        Tenant resumed = signupService.resumeProvisioning(t, null);
        assertEquals(Tenant.Status.TRIAL, resumed.getStatus());

        // drop guard must refuse while the tenant is live
        assertThrows(IllegalStateException.class, () -> provisioner.drop(ALPHA));

        // ...but after offboarding the drop is allowed
        TenantContext.clear();
        Tenant offboarded = tenants.findBySlug(ALPHA).orElseThrow();
        offboarded.setStatus(Tenant.Status.OFFBOARDED);
        tenants.save(offboarded);
        provisioner.drop(ALPHA);
        assertFalse(provisioner.schemaExists("t_it-alpha"));
        deleteTenantArtifacts(offboarded.getId());
        tenants.delete(offboarded);
    }

    @Test
    void workspaceStatusEndpoint() throws Exception {
        provisionTenant(ALPHA, ALPHA_EMAIL);

        mvc.perform(get("/api/public/tenants/{slug}/status", ALPHA)
                        .header("Host", "localhost"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.exists").value(true))
                .andExpect(jsonPath("$.status").value("TRIAL"));

        mvc.perform(get("/api/public/tenants/{slug}/status", "no-such-ws")
                        .header("Host", "localhost"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.exists").value(false));
    }

    @Test
    void connectionSearchPathIsResetOnRelease() throws Exception {
        provisionTenant(ALPHA, ALPHA_EMAIL);
        var provider = new com.elanjaibuildos.backend.common.multitenancy
                .SchemaMultiTenantConnectionProvider(dataSource);

        Connection c = provider.getConnection("t_it-alpha");
        try (Statement s = c.createStatement();
             ResultSet rs = s.executeQuery("SHOW search_path")) {
            rs.next();
            assertTrue(rs.getString(1).contains("t_it-alpha"));
        }
        // simulate a mid-request failure, then release — reset must still happen
        try (Statement s = c.createStatement()) {
            s.execute("SELECT * FROM definitely_missing_table");
            fail("expected SQLException");
        } catch (Exception expected) { /* mid-request failure */ }
        provider.releaseConnection("t_it-alpha", c);

        // pooled connection handed out again must see the public path
        try (Connection next = provider.getAnyConnection();
             Statement s = next.createStatement();
             ResultSet rs = s.executeQuery("SHOW search_path")) {
            rs.next();
            assertEquals("public", rs.getString(1));
        }

        // repeated borrows across schemas — the reset must hold on every release,
        // not just once after a failure
        provisionTenant(BETA, BETA_EMAIL);
        for (int i = 0; i < 3; i++) {
            for (String schema : new String[] { "t_it-alpha", "t_it-beta" }) {
                Connection conn = provider.getConnection(schema);
                try (Statement s = conn.createStatement();
                     ResultSet rs = s.executeQuery("SHOW search_path")) {
                    rs.next();
                    assertTrue(rs.getString(1).contains(schema),
                            "borrow " + i + " for " + schema);
                }
                provider.releaseConnection(schema, conn);
            }
            try (Connection next = provider.getAnyConnection();
                 Statement s = next.createStatement();
                 ResultSet rs = s.executeQuery("SHOW search_path")) {
                rs.next();
                assertEquals("public", rs.getString(1), "after release round " + i);
            }
        }
    }

    private String login(String slug, String email) throws Exception {
        var result = mvc.perform(post("/api/auth/login")
                        .header("Host", slug + ".localhost")
                        .contentType("application/json")
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + OWNER_PASSWORD + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        String body = result.getResponse().getContentAsString();
        String marker = "\"token\":\"";
        int i = body.indexOf(marker);
        return i < 0 ? null : body.substring(i + marker.length(), body.indexOf('"', i + marker.length()));
    }
}
