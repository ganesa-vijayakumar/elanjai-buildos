package com.elanjaibuildos.backend;

import org.junit.jupiter.api.Test;
import org.springframework.test.context.TestPropertySource;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * app.tenancy.dev-header-enabled=false (default): X-Tenant-ID must be ignored —
 * a client header can never substitute for canonical host resolution.
 */
@TestPropertySource(properties = "app.tenancy.dev-header-enabled=false")
class DevHeaderDisabledIT extends TenancyITSupport {

    private static final String SLUG = "it-hdr-off";
    private static final String EMAIL = "owner@it-hdr-off.test";

    @Test
    void tenantHeaderIsIgnoredWhenDisabled() throws Exception {
        provisionTenant(SLUG, EMAIL);
        String token = tenantToken(EMAIL, SLUG, "OWNER");

        mvc.perform(get("/api/sites")
                        .header("Host", "localhost")
                        .header("X-Tenant-ID", SLUG)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("NO_TENANT_CONTEXT"));
    }
}
