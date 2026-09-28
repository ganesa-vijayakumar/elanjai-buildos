package com.elanjaibuildos.backend.platform.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "platform_users")
public class PlatformUser {

    public enum Role { PLATFORM_ADMIN, PLATFORM_SUPPORT }

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 190)
    private String email;

    @Column(nullable = false, length = 100)
    private String password;

    @Column(nullable = false, length = 160)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private Role role = Role.PLATFORM_ADMIN;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "created_at") private Instant createdAt = Instant.now();
    @Column(name = "last_login_at") private Instant lastLoginAt;

    public UUID getId() { return id; }
    public String getEmail() { return email; }
    public void setEmail(String v) { this.email = v; }
    public String getPassword() { return password; }
    public void setPassword(String v) { this.password = v; }
    public String getName() { return name; }
    public void setName(String v) { this.name = v; }
    public Role getRole() { return role; }
    public void setRole(Role v) { this.role = v; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean v) { this.active = v; }
    public Instant getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(Instant v) { this.lastLoginAt = v; }
}
