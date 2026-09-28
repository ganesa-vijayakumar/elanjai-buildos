package com.elanjaibuildos.backend.identity.service;

import com.elanjaibuildos.backend.common.multitenancy.TenantContext;
import com.elanjaibuildos.backend.identity.api.AuthenticationResponse;
import com.elanjaibuildos.backend.identity.api.UserResponse;
import com.elanjaibuildos.backend.identity.domain.Invite;
import com.elanjaibuildos.backend.identity.domain.PasswordReset;
import com.elanjaibuildos.backend.identity.domain.Role;
import com.elanjaibuildos.backend.identity.domain.User;
import com.elanjaibuildos.backend.platform.service.PlatformGuard;
import com.elanjaibuildos.backend.platform.service.PlatformMailService;
import com.elanjaibuildos.backend.identity.repository.InviteRepository;
import com.elanjaibuildos.backend.identity.repository.PasswordResetRepository;
import com.elanjaibuildos.backend.identity.repository.UserRepository;
import com.elanjaibuildos.backend.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.Locale;
import java.util.UUID;
import com.elanjaibuildos.backend.sites.repository.SiteRepository;

/**
 * Tenant-realm authentication: login, invite acceptance, password reset.
 * All operations execute inside the resolved tenant schema (TenantContext).
 */
@Service
public class AuthService {

    private final UserRepository users;
    private final InviteRepository invites;
    private final PasswordResetRepository resets;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final PlatformMailService mail;
    private final PlatformGuard platformGuard;
    private final UsernameService usernames;
    private final SiteRepository siteRepository;

    /** Workspace URL template for links in mail ({slug} placeholder). */
    @Value("${app.tenant-url-template:http://{slug}.localhost:5173}")
    private String tenantUrlTemplate;

    private String tenantUrl() {
        return tenantUrlTemplate.replace("{slug}", TenantContext.getSlug());
    }

    public AuthService(UserRepository users, InviteRepository invites,
                       PasswordResetRepository resets, PasswordEncoder encoder,
                       JwtService jwt, PlatformMailService mail, PlatformGuard platformGuard,
                       UsernameService usernames, SiteRepository siteRepository) {
        this.users = users; this.invites = invites; this.resets = resets;
        this.encoder = encoder; this.jwt = jwt; this.mail = mail;
        this.platformGuard = platformGuard; this.usernames = usernames;
        this.siteRepository = siteRepository;
    }

    /**
     * Sign-in by {@code identifier} = email | {@code <local>} | {@code <local>@<slug>}.
     * Precedence per the identity contract: (1) exact normalized email lookup —
     * legacy emails like user@acme stay valid; (2) canonical username lookup,
     * scoped to the resolved tenant. A username shape whose suffix ≠ the host
     * slug is rejected before any username lookup, with no fallback.
     */
    public AuthenticationResponse login(String identifier, String rawPassword) {
        String id = identifier == null ? "" : identifier.trim().toLowerCase(Locale.ROOT);
        User u = users.findByEmail(id).orElseGet(() -> resolveUsernameIdentifier(id));
        if (u == null || !encoder.matches(rawPassword, u.getPassword())
                || !"active".equals(u.getStatus())) {
            throw new IllegalArgumentException("Invalid credentials.");
        }
        u.setLastLoginAt(Instant.now());
        users.save(u);
        return new AuthenticationResponse(
                jwt.generateTenantToken(u.getEmail(), TenantContext.getSlug(), u.getRole().name()),
                map(u));
    }

    /**
     * Username resolution — only after an exact-email miss, only inside a bound
     * tenant context. The @-suffix of a canonical username must equal the
     * resolved slug; anything else returns null (uniform "Invalid credentials").
     */
    private User resolveUsernameIdentifier(String id) {
        String slug = TenantContext.getSlug();
        if (slug == null || id.isEmpty()) return null;
        if (UsernameService.isUsernameShape(id)) {
            if (!UsernameService.suffix(id).equals(slug)) return null;
            return users.findByUsername(id).orElse(null);
        }
        if (!id.contains("@") && UsernameService.isValidLocal(id)) {
            return users.findByUsername(UsernameService.canonical(id, slug)).orElse(null);
        }
        return null;
    }

    public UserResponse me(String email) {
        return users.findByEmail(email).map(this::map)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    // ---------- invites ----------
    @Transactional
    public Invite invite(String email, Role role, UUID siteId, UUID invitedBy) {
        String e = email.toLowerCase();
        if (users.existsByEmail(e)) throw new IllegalArgumentException("User already exists in this workspace.");
        usernames.assertEmailNotUsername(e);   // disjointness: an email equal to a username is rejected
        Invite inv = new Invite();
        inv.setEmail(e);
        inv.setRole(role);
        inv.setSiteId(siteId);
        inv.setInvitedBy(invitedBy);
        inv.setToken(token());
        inv.setExpiresAt(Instant.now().plus(72, ChronoUnit.HOURS));   // BR: invite links 72h, single-use
        invites.save(inv);

        String link = tenantUrl() + "/accept-invite?token=" + inv.getToken();
        mail.queueEmail(null, "invite", e, "You've been invited to ElanjaiBuildos",
                "Accept your invite: " + link + "\n\nLink expires in 72 hours.");
        return inv;
    }

    @Transactional
    public AuthenticationResponse acceptInvite(String token, String fullName, String rawPassword) {
        Invite inv = invites.findByToken(token)
                .filter(Invite::usable)
                .orElseThrow(() -> new IllegalArgumentException("Invite link is invalid or expired."));
        if (rawPassword == null || rawPassword.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters.");
        }
        // staff-user limit applies to non-client invites (D-049 clients are unmetered)
        if (inv.getRole() != Role.CLIENT) {
            platformGuard.checkAndIncrement(
                    com.elanjaibuildos.backend.platform.domain.UsageCounter.M_STAFF_USERS);
        }
        User u = new User();
        u.setEmail(inv.getEmail());
        u.setFullName(fullName != null && !fullName.isBlank() ? fullName : inv.getEmail());
        u.setPassword(encoder.encode(rawPassword));
        u.setRole(inv.getRole());
        u.setStatus("active");
        usernames.assignDerived(u, TenantContext.getSlug());   // new users get canonical <local>@<slug>
        users.save(u);
        inv.setAcceptedAt(Instant.now());
        invites.save(inv);

        // link client user to their site (one client per project, D-049)
        if (inv.getSiteId() != null && inv.getRole() == Role.CLIENT) {
            linkClientToSite(inv.getSiteId(), u);
        }
        return new AuthenticationResponse(
                jwt.generateTenantToken(u.getEmail(), TenantContext.getSlug(), u.getRole().name()), map(u));
    }

    private void linkClientToSite(UUID siteId, User client) {
        siteRepository.findById(siteId).ifPresent(site -> {
            site.setClientUser(client);                 // D-049: one client per project
            if (site.getClientName() == null) site.setClientName(client.getFullName());
            if (site.getClientEmail() == null) site.setClientEmail(client.getEmail());
            siteRepository.save(site);
        });
    }

    // ---------- password reset ----------
    @Transactional
    public void forgotPassword(String identifier) {
        String id = identifier == null ? "" : identifier.trim().toLowerCase(Locale.ROOT);
        User resolved = users.findByEmail(id).orElseGet(() -> resolveUsernameIdentifier(id));
        if (resolved == null) return;   // always succeeds — don't leak whether the identifier exists
        users.findByEmail(resolved.getEmail()).ifPresent(u -> {
            PasswordReset pr = new PasswordReset();
            pr.setEmail(u.getEmail());
            pr.setToken(token());
            pr.setExpiresAt(Instant.now().plus(1, ChronoUnit.HOURS));   // BR-021: 1h single-use
            resets.save(pr);
            String link = tenantUrl() + "/reset-password?token=" + pr.getToken();
            mail.queueEmail(null, "password_reset", u.getEmail(),
                    "Reset your ElanjaiBuildos password",
                    "Reset link: " + link + "\n\nExpires in 1 hour.");
        });
        // always succeeds — don't leak whether email exists
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordReset pr = resets.findByToken(token)
                .filter(PasswordReset::usable)
                .orElseThrow(() -> new IllegalArgumentException("Reset link is invalid or expired."));
        if (newPassword == null || newPassword.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters.");
        }
        User u = users.findByEmail(pr.getEmail()).orElseThrow();
        u.setPassword(encoder.encode(newPassword));
        users.save(u);
        pr.setUsedAt(Instant.now());
        resets.save(pr);
    }

    private UserResponse map(User u) {
        return UserResponse.builder()
                .id(u.getId()).email(u.getEmail()).username(u.getUsername())
                .fullName(u.getFullName()).phone(u.getPhone()).role(u.getRole()).build();
    }

    private static String token() {
        byte[] b = new byte[24];
        new SecureRandom().nextBytes(b);
        return HexFormat.of().formatHex(b);
    }
}
