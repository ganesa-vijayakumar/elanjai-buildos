package com.elanjaibuildos.backend.platform.model;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "platform_audit_log")
public class PlatformAuditLog {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "actor_id") private UUID actorId;
    @Column(name = "actor_role", length = 24) private String actorRole;
    @Column(nullable = false, length = 80) private String action;
    @Column(name = "entity_type", length = 60) private String entityType;
    @Column(name = "entity_id", length = 80) private String entityId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> details;

    @Column(length = 60) private String ip;
    @Column(name = "created_at") private Instant createdAt = Instant.now();

    public PlatformAuditLog() {}

    public PlatformAuditLog(UUID actorId, String actorRole, String action,
                            String entityType, String entityId, Map<String, Object> details, String ip) {
        this.actorId = actorId; this.actorRole = actorRole; this.action = action;
        this.entityType = entityType; this.entityId = entityId;
        this.details = details; this.ip = ip;
    }

    public UUID getId() { return id; }
}
