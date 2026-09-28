package com.elanjaibuildos.backend;

import org.junit.jupiter.api.Test;
import org.springframework.test.context.TestPropertySource;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * app.tenancy.dev-header-enabled=true (explicit dev opt-in): X-Tenant-ID
 * resolves the tenant so plain-localhost development still works.
 */
@TestPropertySource(properties = "app.tenancy.dev-header-enabled=true")
class DevHeaderEnabledIT extends TenancyITSupport {

    private static final String SLUG = "it-hdr-on";
    private static final String EMAIL = "owner@it-hdr-on.test";

    @Test
    void tenantHeaderResolvesInDevMode() throws Exception {
        provisionTenant(SLUG, EMAIL);
        String token = tenantToken(EMAIL, SLUG, "OWNER");

        mvc.perform(get("/api/sites")
                        .header("Host", "localhost")
                        .header("X-Tenant-ID", SLUG)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void tenantHeaderRejectsUnknownSlug() throws Exception {
        mvc.perform(get("/api/sites")
                        .header("Host", "localhost")
                        .header("X-Tenant-ID", "no-such-ws")
                        .header("Authorization", "Bearer " + tenantToken("u@x.test", "no-such-ws", "OWNER")))
                .andExpect(status().isNotFound())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                        .jsonPath("$.error").value("WORKSPACE_NOT_FOUND"));
    }
}
