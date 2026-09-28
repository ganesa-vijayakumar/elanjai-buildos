package com.elanjaibuildos.backend.platform.service;

import com.elanjaibuildos.backend.platform.model.PlatformAuditLog;
import com.elanjaibuildos.backend.platform.repository.PlatformAuditLogRepository;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
public class AuditService {

    private final PlatformAuditLogRepository audit;

    public AuditService(PlatformAuditLogRepository audit) {
        this.audit = audit;
    }

    public void log(UUID actorId, String actorRole, String action,
                    String entityType, String entityId, Map<String, Object> details, String ip) {
        audit.save(new PlatformAuditLog(actorId, actorRole, action, entityType, entityId, details, ip));
    }

    public void logSystem(String action, String entityType, String entityId, Map<String, Object> details) {
        audit.save(new PlatformAuditLog(null, "SYSTEM", action, entityType, entityId, details, null));
    }
}
