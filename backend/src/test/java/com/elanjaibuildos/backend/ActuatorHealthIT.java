package com.elanjaibuildos.backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;

/**
 * The uptime surface: /api/actuator/health must be reachable without
 * authentication on any host class (it carries no tenant data — details are
 * disabled via management.endpoint.health.show-details=never).
 */
class ActuatorHealthIT extends TenancyITSupport {

    @Test
    void healthEndpointIsPublicAndUp() throws Exception {
        mvc.perform(get("/api/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }
}
