package com.elanjaibuildos.backend.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "invites")
public class Invite {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 190)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Column(nullable = false, unique = true, length = 80)
    private String token;

    @Column(name = "site_id")
    private UUID siteId;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "accepted_at")
    private Instant acceptedAt;

    @Column(name = "invited_by")
    private UUID invitedBy;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    public boolean usable() {
        return acceptedAt == null && expiresAt.isAfter(Instant.now());
    }

    public UUID getId() { return id; }
    public String getEmail() { return email; }
    public void setEmail(String v) { this.email = v; }
    public Role getRole() { return role; }
    public void setRole(Role v) { this.role = v; }
    public String getToken() { return token; }
    public void setToken(String v) { this.token = v; }
    public UUID getSiteId() { return siteId; }
    public void setSiteId(UUID v) { this.siteId = v; }
    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant v) { this.expiresAt = v; }
    public Instant getAcceptedAt() { return acceptedAt; }
    public void setAcceptedAt(Instant v) { this.acceptedAt = v; }
    public UUID getInvitedBy() { return invitedBy; }
    public void setInvitedBy(UUID v) { this.invitedBy = v; }
}
