package com.elanjaibuildos.backend.platform.repository;

import com.elanjaibuildos.backend.platform.model.TenantNotification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TenantNotificationRepository extends JpaRepository<TenantNotification, UUID> {
    List<TenantNotification> findTop50ByStatusOrderByCreatedAtAsc(String status);
}
