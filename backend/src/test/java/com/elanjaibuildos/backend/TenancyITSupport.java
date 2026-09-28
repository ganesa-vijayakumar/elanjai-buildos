package com.elanjaibuildos.backend;

import com.elanjaibuildos.backend.common.multitenancy.TenantContext;
import com.elanjaibuildos.backend.common.multitenancy.TenantSchemaProvisioner;
import com.elanjaibuildos.backend.identity.repository.UserRepository;
import com.elanjaibuildos.backend.platform.domain.SignupRequest;
import com.elanjaibuildos.backend.platform.domain.Tenant;
import com.elanjaibuildos.backend.platform.repository.PlatformUserRepository;
import com.elanjaibuildos.backend.platform.repository.SignupRequestRepository;
import com.elanjaibuildos.backend.platform.repository.TenantRepository;
import com.elanjaibuildos.backend.platform.service.SignupService;
import com.elanjaibuildos.backend.security.JwtService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import javax.sql.DataSource;
import java.util.ArrayList;
import java.util.List;

/**
 * Shared harness for tenancy integration tests: boots the full app against a
 * dedicated sandbox database (TEST_DB_URL) and provides tenant provisioning /
 * cleanup helpers. Never run against a database containing real tenants —
 * cleanup drops the schemas it creates.
 */
@SpringBootTest
@AutoConfigureMockMvc
public abstract class TenancyITSupport {

    protected static final String OWNER_PASSWORD = "TestPass123!";

    @Autowired protected MockMvc mvc;
    @Autowired protected JwtService jwt;
    @Autowired protected DataSource dataSource;
    @Autowired protected SignupService signupService;
    @Autowired protected TenantRepository tenants;
    @Autowired protected SignupRequestRepository signups;
    @Autowired protected UserRepository users;
    @Autowired protected PlatformUserRepository platformUsers;
    @Autowired protected TenantSchemaProvisioner provisioner;

    private final List<String> created = new ArrayList<>();

    /** Runs the real onboarding pipeline: signup → approve → schema + owner + TRIAL. */
    protected Tenant provisionTenant(String slug, String email) {
        SignupRequest req = signupService.signup(
                "IT Co " + slug, "Owner " + slug, email, "9999999999",
                OWNER_PASSWORD, slug, null, "Tamil Nadu", "business", "monthly");
        Tenant t = signupService.approve(req.getId(), null);
        created.add(slug);
        return t;
    }

    protected String tenantToken(String email, String slug, String role) {
        return jwt.generateTenantToken(email, slug, role);
    }

    protected String platformToken() {
        return jwt.generatePlatformToken("admin@elanjai.local", "PLATFORM_ADMIN");
    }

    @BeforeEach
    void clearContext() {
        TenantContext.clear();
    }

    /** Remove public rows first so the provisioner drop guard is satisfied, then drop schemas. */
    @AfterEach
    void cleanupTenants() {
        for (String slug : created) {
            try {
                TenantContext.clear();
                tenants.findBySlug(slug).ifPresent(t -> deleteTenantArtifacts(t.getId()));
                tenants.findBySlug(slug).ifPresent(tenants::delete);
                signups.findTopBySlugOrderByCreatedAtDesc(slug).ifPresent(signups::delete);
                provisioner.drop(slug);
            } catch (Exception ignored) {
                // best-effort cleanup — assertions decide the verdict
            } finally {
                TenantContext.clear();
            }
        }
        created.clear();
    }

    /** FK children of tenants(id) that the test pipeline touches. */
    protected void deleteTenantArtifacts(java.util.UUID tenantId) {
        try (var c = dataSource.getConnection()) {
            for (String table : new String[]{"tenant_notifications", "usage_counters",
                    "invoices", "subscriptions"}) {
                try (var ps = c.prepareStatement("DELETE FROM " + table + " WHERE tenant_id = ?")) {
                    ps.setObject(1, tenantId);
                    ps.executeUpdate();
                }
            }
        } catch (Exception ignored) {
            // best-effort cleanup
        }
    }
}
