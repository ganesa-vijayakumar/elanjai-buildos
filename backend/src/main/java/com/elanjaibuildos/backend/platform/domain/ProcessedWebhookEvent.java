package com.elanjaibuildos.backend.platform.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "processed_webhook_events")
public class ProcessedWebhookEvent {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "event_id", nullable = false, unique = true, length = 120)
    private String eventId;

    @Column(name = "event_type", length = 80)
    private String eventType;

    @Column(name = "processed_at") private Instant processedAt = Instant.now();

    public ProcessedWebhookEvent() {}
    public ProcessedWebhookEvent(String eventId, String eventType) {
        this.eventId = eventId; this.eventType = eventType;
    }

    public UUID getId() { return id; }
    public String getEventId() { return eventId; }
}
