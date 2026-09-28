package com.elanjaibuildos.backend.config;

import com.elanjaibuildos.backend.common.multitenancy.TenantContext;
import com.elanjaibuildos.backend.common.multitenancy.TenantSchemaProvisioner;
import com.elanjaibuildos.backend.identity.domain.Role;
import com.elanjaibuildos.backend.identity.domain.User;
import com.elanjaibuildos.backend.platform.domain.Plan;
import com.elanjaibuildos.backend.platform.domain.PlatformUser;
import com.elanjaibuildos.backend.platform.domain.Tenant;
import com.elanjaibuildos.backend.platform.repository.PlanRepository;
import com.elanjaibuildos.backend.platform.repository.PlatformUserRepository;
import com.elanjaibuildos.backend.platform.repository.TenantRepository;
import com.elanjaibuildos.backend.identity.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import com.elanjaibuildos.backend.sites.domain.Site;

/**
 * Demo tenant seed (dev only, gated by app.demo.seed): creates a `demo` tenant
 * with a provisioned t_demo schema and four demo users. Runs tenant Flyway
 * migrations on all existing tenant schemas (catch-up).
 */
@Configuration
public class DataInitializer {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    @Bean
    CommandLineRunner tenantMigrationsCatchUp(TenantSchemaProvisioner provisioner,
                                              @Value("${app.demo.seed:true}") boolean demoSeed) {
        return args -> {
            int n = provisioner.migrateAllTenants();
            if (n > 0) log.info("Tenant migration catch-up: {} schema(s) migrated", n);
        };
    }

    @Bean
    CommandLineRunner seedPlatformAdmin(PlatformUserRepository platformUsers, PasswordEncoder encoder,
                                        @Value("${platform.admin.email:admin@elanjai.local}") String email,
                                        @Value("${platform.admin.password:Admin@123}") String password) {
        return args -> {
            if (platformUsers.findByEmail(email).isEmpty()) {
                PlatformUser u = new PlatformUser();
                u.setEmail(email);
                u.setName("Platform Admin");
                u.setRole(PlatformUser.Role.PLATFORM_ADMIN);
                u.setPassword(encoder.encode(password));
                platformUsers.saveAndFlush(u);
                log.info("Platform admin seeded: {}", email);
            }
        };
    }

    @Bean
    CommandLineRunner seedPlatformSupport(PlatformUserRepository platformUsers, PasswordEncoder encoder,
                                          @Value("${platform.support.email:support@elanjai.local}") String email,
                                          @Value("${platform.support.password:Support@123}") String password,
                                          @Value("${app.demo.seed:true}") boolean demoSeed) {
        return args -> {
            if (demoSeed && platformUsers.findByEmail(email).isEmpty()) {
                PlatformUser u = new PlatformUser();
                u.setEmail(email);
                u.setName("Platform Support");
                u.setRole(PlatformUser.Role.PLATFORM_SUPPORT);
                u.setPassword(encoder.encode(password));
                platformUsers.saveAndFlush(u);
                log.info("Platform support seeded: {}", email);
            }
        };
    }

    @Bean
    CommandLineRunner seedDemoTenant(TenantRepository tenants, PlanRepository plans,
                                     TenantSchemaProvisioner provisioner,
                                     UserRepository tenantUsers, PasswordEncoder encoder,
                                     org.springframework.transaction.PlatformTransactionManager txManager,
                                     com.elanjaibuildos.backend.identity.service.UsernameService usernames,
                                     @Value("${app.demo.seed:true}") boolean demoSeed) {
        return args -> {
            if (!demoSeed || tenants.existsBySlug("demo")) return;

            Plan plan = plans.findByCode("business").orElseGet(() -> plans.findAll().get(0));
            Tenant t = new Tenant();
            t.setCompanyName("Demo Constructions");
            t.setSlug("demo");
            t.setSchemaName(TenantSchemaProvisioner.schemaFor("demo"));
            t.setOwnerName("Demo Owner");
            t.setOwnerEmail("owner@demo.local");
            t.setPlan(plan);
            t.setStatus(Tenant.Status.TRIAL);
            t.setTrialEndsAt(Instant.now().plus(14, ChronoUnit.DAYS));
            t.setCurrentPeriodEnd(t.getTrialEndsAt());
            tenants.save(t);

            provisioner.provision("demo");

            TenantContext.setTenant("demo", t.getSchemaName(), "TRIAL");
            try {
                new TransactionTemplate(txManager).execute(s -> {
                    seedUser(tenantUsers, encoder, usernames, "owner@demo.local", "Demo Owner", "Owner@12345", Role.OWNER);
                    seedUser(tenantUsers, encoder, usernames, "admin@demo.local", "Demo Admin", "Admin@12345", Role.ADMIN);
                    seedUser(tenantUsers, encoder, usernames, "manager@demo.local", "Site Manager", "Manager@12345", Role.SITE_MANAGER);
                    seedUser(tenantUsers, encoder, usernames, "client@demo.local", "Demo Client", "Client@12345", Role.CLIENT);
                    return null;
                });
            } finally {
                TenantContext.clear();
            }
            log.info("Demo tenant 'demo' seeded — login at demo.localhost (owner@demo.local / Owner@12345)");
        };
    }

    private void seedUser(UserRepository repo, PasswordEncoder enc,
                          com.elanjaibuildos.backend.identity.service.UsernameService usernames,
                          String email, String name, String raw, Role role) {
        if (repo.existsByEmail(email)) return;
        User u = new User();
        u.setEmail(email);
        u.setFullName(name);
        u.setPassword(enc.encode(raw));
        u.setRole(role);
        u.setStatus("active");
        usernames.assignDerived(u, "demo");   // owner@demo.local → owner@demo
        repo.save(u);
    }
}
