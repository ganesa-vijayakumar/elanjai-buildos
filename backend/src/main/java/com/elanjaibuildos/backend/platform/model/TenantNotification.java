package com.elanjaibuildos.backend.platform.model;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "tenant_notifications")
public class TenantNotification {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id") private UUID tenantId;
    @Column(nullable = false, length = 10) private String channel;  // email | inapp
    @Column(nullable = false, length = 40) private String type;
    @Column(length = 190) private String recipient;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> payload;

    @Column(nullable = false, length = 16) private String status = "pending";
    @Column(name = "sent_at") private Instant sentAt;
    @Column(name = "created_at") private Instant createdAt = Instant.now();

    public UUID getId() { return id; }
    public UUID getTenantId() { return tenantId; }
    public void setTenantId(UUID v) { this.tenantId = v; }
    public String getChannel() { return channel; }
    public void setChannel(String v) { this.channel = v; }
    public String getType() { return type; }
    public void setType(String v) { this.type = v; }
    public String getRecipient() { return recipient; }
    public void setRecipient(String v) { this.recipient = v; }
    public Map<String, Object> getPayload() { return payload; }
    public void setPayload(Map<String, Object> v) { this.payload = v; }
    public String getStatus() { return status; }
    public void setStatus(String v) { this.status = v; }
    public Instant getSentAt() { return sentAt; }
    public void setSentAt(Instant v) { this.sentAt = v; }
}
