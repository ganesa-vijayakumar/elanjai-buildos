package com.elanjaibuildos.backend.platform.repository;

import com.elanjaibuildos.backend.platform.model.ProcessedWebhookEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ProcessedWebhookEventRepository extends JpaRepository<ProcessedWebhookEvent, UUID> {
    boolean existsByEventId(String eventId);
}
