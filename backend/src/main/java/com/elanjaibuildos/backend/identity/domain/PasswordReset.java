package com.elanjaibuildos.backend.identity.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "password_resets")
public class PasswordReset {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 190)
    private String email;

    @Column(nullable = false, unique = true, length = 80)
    private String token;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "used_at")
    private Instant usedAt;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    public boolean usable() {
        return usedAt == null && expiresAt.isAfter(Instant.now());
    }

    public UUID getId() { return id; }
    public String getEmail() { return email; }
    public void setEmail(String v) { this.email = v; }
    public String getToken() { return token; }
    public void setToken(String v) { this.token = v; }
    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant v) { this.expiresAt = v; }
    public Instant getUsedAt() { return usedAt; }
    public void setUsedAt(Instant v) { this.usedAt = v; }
}
