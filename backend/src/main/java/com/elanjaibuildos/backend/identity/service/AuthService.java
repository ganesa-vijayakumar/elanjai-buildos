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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.UUID;
import com.elanjaibuildos.backend.identity.domain.Invite;
import com.elanjaibuildos.backend.identity.domain.PasswordReset;
import com.elanjaibuildos.backend.identity.domain.Role;
import com.elanjaibuildos.backend.identity.domain.User;
import com.elanjaibuildos.backend.sites.repository.SiteRepository;
import com.elanjaibuildos.backend.platform.domain.Tenant;
import com.elanjaibuildos.backend.platform.domain.UsageCounter;

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
    private final com.elanjaibuildos.backend.sites.repository.SiteRepository siteRepository;

    public AuthService(UserRepository users, InviteRepository invites,
                       PasswordResetRepository resets, PasswordEncoder encoder,
                       JwtService jwt, PlatformMailService mail, PlatformGuard platformGuard,
                       com.elanjaibuildos.backend.sites.repository.SiteRepository siteRepository) {
        this.users = users; this.invites = invites; this.resets = resets;
        this.encoder = encoder; this.jwt = jwt; this.mail = mail;
        this.platformGuard = platformGuard; this.siteRepository = siteRepository;
    }

    public AuthenticationResponse login(String email, String rawPassword) {
        User u = users.findByEmail(email.toLowerCase())
                .filter(x -> encoder.matches(rawPassword, x.getPassword()))
                .filter(x -> "active".equals(x.getStatus()))
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials."));
        u.setLastLoginAt(Instant.now());
        users.save(u);
        return new AuthenticationResponse(
                jwt.generateTenantToken(u.getEmail(), TenantContext.getSlug(), u.getRole().name()),
                map(u));
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
        Invite inv = new Invite();
        inv.setEmail(e);
        inv.setRole(role);
        inv.setSiteId(siteId);
        inv.setInvitedBy(invitedBy);
        inv.setToken(token());
        inv.setExpiresAt(Instant.now().plus(72, ChronoUnit.HOURS));   // BR: invite links 72h, single-use
        invites.save(inv);

        String link = "http://" + TenantContext.getSlug() + ".localhost:5173/accept-invite?token=" + inv.getToken();
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
    public void forgotPassword(String email) {
        users.findByEmail(email.toLowerCase()).ifPresent(u -> {
            PasswordReset pr = new PasswordReset();
            pr.setEmail(u.getEmail());
            pr.setToken(token());
            pr.setExpiresAt(Instant.now().plus(1, ChronoUnit.HOURS));   // BR-021: 1h single-use
            resets.save(pr);
            String link = "http://" + TenantContext.getSlug()
                    + ".localhost:5173/reset-password?token=" + pr.getToken();
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
                .id(u.getId()).email(u.getEmail()).fullName(u.getFullName())
                .phone(u.getPhone()).role(u.getRole()).build();
    }

    private static String token() {
        byte[] b = new byte[24];
        new SecureRandom().nextBytes(b);
        return HexFormat.of().formatHex(b);
    }
}
