package com.elanjaibuildos.backend.platform.repository;

import com.elanjaibuildos.backend.platform.model.PlatformAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PlatformAuditLogRepository extends JpaRepository<PlatformAuditLog, UUID> {
    List<PlatformAuditLog> findTop200ByOrderByCreatedAtDesc();
    List<PlatformAuditLog> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(String entityType, String entityId);
}
