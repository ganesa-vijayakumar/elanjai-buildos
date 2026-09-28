package com.elanjaibuildos.backend.platform.service;

import com.elanjaibuildos.backend.common.multitenancy.TenantContext;
import com.elanjaibuildos.backend.common.multitenancy.TenantSchemaProvisioner;
import com.elanjaibuildos.backend.model.Role;
import com.elanjaibuildos.backend.model.User;
import com.elanjaibuildos.backend.platform.model.Plan;
import com.elanjaibuildos.backend.platform.model.SignupRequest;
import com.elanjaibuildos.backend.platform.model.Tenant;
import com.elanjaibuildos.backend.platform.repository.PlanRepository;
import com.elanjaibuildos.backend.platform.repository.PlatformSettingRepository;
import com.elanjaibuildos.backend.platform.repository.SignupRequestRepository;
import com.elanjaibuildos.backend.platform.repository.TenantRepository;
import com.elanjaibuildos.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Hybrid onboarding (D-005):
 *   signup → email verification → super-admin approval → schema provisioning
 *   → owner user created in t_<slug> → welcome email.
 */
@Service
public class SignupService {

    private static final Logger log = LoggerFactory.getLogger(SignupService.class);
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String SLUG_PATTERN = "^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$";

    private final SignupRequestRepository signups;
    private final TenantRepository tenants;
    private final PlanRepository plans;
    private final UserRepository tenantUsers;
    private final PlatformSettingRepository settings;
    private final TenantSchemaProvisioner provisioner;
    private final PlatformMailService mail;
    private final AuditService audit;
    private final PasswordEncoder encoder;
    private final TransactionTemplate txTemplate;

    @Value("${app.tenancy.trial-days:14}")
    private int trialDays;

    @Value("${app.base-url:http://localhost:5173}")
    private String baseUrl;

    public SignupService(SignupRequestRepository signups, TenantRepository tenants,
                         PlanRepository plans, UserRepository tenantUsers,
                         PlatformSettingRepository settings,
                         TenantSchemaProvisioner provisioner, PlatformMailService mail,
                         AuditService audit, PasswordEncoder encoder,
                         org.springframework.transaction.PlatformTransactionManager txManager) {
        this.signups = signups; this.tenants = tenants; this.plans = plans;
        this.tenantUsers = tenantUsers; this.settings = settings;
        this.provisioner = provisioner; this.mail = mail; this.audit = audit;
        this.encoder = encoder;
        this.txTemplate = new TransactionTemplate(txManager);
    }

    public static class SignupException extends RuntimeException {
        public SignupException(String m) { super(m); }
    }

    /** Stage 1: validate + create pending signup + send verification email. */
    public SignupRequest signup(String companyName, String ownerName, String email, String phone,
                                String rawPassword, String slug, String gstin, String state,
                                String planCode, String billingCycle) {
        validateSlug(slug);
        if (rawPassword == null || rawPassword.length() < 8) {
            throw new SignupException("Password must be at least 8 characters.");
        }
        if (signups.existsByEmailAndStatus(email, SignupRequest.Status.PENDING)) {
            throw new SignupException("A signup for this email is already pending review.");
        }
        if (tenants.existsBySlug(slug) || signups.existsBySlugAndStatus(slug, SignupRequest.Status.PENDING)) {
            throw new SignupException("This workspace address is taken. Choose another.");
        }
        Plan plan = plans.findByCode(planCode)
                .orElseThrow(() -> new SignupException("Unknown plan: " + planCode));

        SignupRequest req = new SignupRequest();
        req.setCompanyName(companyName);
        req.setOwnerName(ownerName);
        req.setEmail(email);
        req.setPhone(phone);
        req.setPasswordHash(encoder.encode(rawPassword));
        req.setSlug(slug);
        req.setGstin(gstin);
        req.setState(state);
        req.setPlan(plan);
        req.setBillingCycle("yearly".equalsIgnoreCase(billingCycle) ? "yearly" : "monthly");
        req.setVerifyToken(HexFormat.of().formatHex(randomBytes(24)));
        signups.save(req);

        String link = baseUrl + "/verify-email?token=" + req.getVerifyToken();
        mail.sendNow(email, "Verify your ElanjaiBuildos signup",
                "Hi " + ownerName + ",\n\nConfirm your email to submit your workspace request:\n\n"
                        + link + "\n\nIf you didn't sign up, ignore this email.");
        audit.logSystem("signup.submitted", "signup_request", req.getId().toString(),
                Map.of("slug", slug, "plan", planCode));
        return req;
    }

    /** Stage 2: email verification. */
    public void verifyEmail(String token) {
        SignupRequest req = signups.findByVerifyToken(token)
                .orElseThrow(() -> new SignupException("Invalid or expired verification link."));
        if (req.getEmailVerified()) return;
        req.setEmailVerified(true);
        req.setVerifyToken(null);
        signups.save(req);
        audit.logSystem("signup.email_verified", "signup_request", req.getId().toString(), Map.of());
    }

    /** Stage 3a: approve → provision schema → create owner → trial. */
    public Tenant approve(UUID signupId, UUID adminId) {
        SignupRequest req = signups.findById(signupId)
                .orElseThrow(() -> new SignupException("Signup not found."));
        if (req.getStatus() != SignupRequest.Status.PENDING) {
            throw new SignupException("Signup already " + req.getStatus());
        }

        String schema = TenantSchemaProvisioner.schemaFor(req.getSlug());
        Tenant t = new Tenant();
        t.setCompanyName(req.getCompanyName());
        t.setSlug(req.getSlug());
        t.setSchemaName(schema);
        t.setOwnerName(req.getOwnerName());
        t.setOwnerEmail(req.getEmail());
        t.setPhone(req.getPhone());
        t.setGstin(req.getGstin());
        t.setState(req.getState());
        t.setPlan(req.getPlan());
        t.setBillingCycle(req.getBillingCycle());
        t.setStatus(Tenant.Status.PROVISIONING);
        t.setApprovedBy(adminId);
        t.setApprovedAt(Instant.now());
        t.setTrialEndsAt(Instant.now().plus(trialDays, ChronoUnit.DAYS));
        t.setCurrentPeriodEnd(t.getTrialEndsAt());
        tenants.save(t);

        try {
            provisioner.provision(req.getSlug());
            createOwnerInTenantSchema(t, req);
            t.setStatus(Tenant.Status.TRIAL);
            tenants.save(t);
            req.setStatus(SignupRequest.Status.PROVISIONED);
        } catch (Exception e) {
            log.error("Provisioning failed for tenant {}", t.getSlug(), e);
            t.setStatus(Tenant.Status.PROVISION_FAILED);
            tenants.save(t);
            req.setStatus(SignupRequest.Status.PROVISION_FAILED);
            signups.save(req);
            throw new SignupException("Provisioning failed: " + e.getMessage());
        }
        req.setReviewedBy(adminId);
        req.setReviewedAt(Instant.now());
        signups.save(req);

        mail.queueEmail(t.getId(), "approved", req.getEmail(),
                "Your ElanjaiBuildos workspace is ready",
                "Hi " + req.getOwnerName() + ",\n\nYour workspace has been approved.\n\n"
                        + "Sign in at http://" + req.getSlug() + ".localhost:5173/login\n"
                        + "Your " + trialDays + "-day trial has started.");
        audit.logSystem("tenant.approved", "tenant", t.getId().toString(),
                Map.of("slug", t.getSlug(), "plan", req.getPlan().getCode()));
        return t;
    }

    /** Stage 3b: reject. */
    public void reject(UUID signupId, UUID adminId, String reason) {
        SignupRequest req = signups.findById(signupId)
                .orElseThrow(() -> new SignupException("Signup not found."));
        if (req.getStatus() != SignupRequest.Status.PENDING) {
            throw new SignupException("Signup already " + req.getStatus());
        }
        req.setStatus(SignupRequest.Status.REJECTED);
        req.setRejectReason(reason);
        req.setReviewedBy(adminId);
        req.setReviewedAt(Instant.now());
        signups.save(req);

        mail.queueEmail(null, "rejected", req.getEmail(),
                "ElanjaiBuildos signup — not approved",
                "Hi " + req.getOwnerName() + ",\n\nYour workspace request was not approved."
                        + (reason != null ? "\n\nReason: " + reason : "")
                        + "\n\nYou can submit a new request anytime.");
        audit.logSystem("tenant.rejected", "signup_request", signupId.toString(),
                Map.of("slug", req.getSlug()));
    }

    public boolean slugAvailable(String slug) {
        try { validateSlug(slug); } catch (SignupException e) { return false; }
        return !tenants.existsBySlug(slug)
            && !signups.existsBySlugAndStatus(slug, SignupRequest.Status.PENDING);
    }

    private void validateSlug(String slug) {
        if (slug == null || !slug.matches(SLUG_PATTERN)) {
            throw new SignupException(
                    "Workspace address must be 3–30 chars: lowercase letters, digits, hyphens.");
        }
        String reserved = settings.findValueByKey("reserved_slugs").orElse("");
        for (String r : reserved.split(",")) {
            if (slug.equals(r.trim())) throw new SignupException("This workspace address is reserved.");
        }
    }

    private void createOwnerInTenantSchema(Tenant tenant, SignupRequest req) {
        TenantContext.setTenant(tenant.getSlug(), tenant.getSchemaName(), "TRIAL");
        try {
            txTemplate.execute(status -> {
                User owner = new User();
                owner.setEmail(req.getEmail());
                owner.setPassword(req.getPasswordHash());
                owner.setFullName(req.getOwnerName());
                owner.setPhone(req.getPhone());
                owner.setRole(Role.OWNER);
                owner.setStatus("active");
                tenantUsers.save(owner);

                // seed tenant_settings.company from signup data
                return null;
            });
        } finally {
            TenantContext.clear();
        }
    }

    private static byte[] randomBytes(int n) {
        byte[] b = new byte[n];
        RANDOM.nextBytes(b);
        return b;
    }
}
