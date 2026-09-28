package com.elanjaibuildos.backend.platform.repository;

import com.elanjaibuildos.backend.platform.model.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {
    Optional<Subscription> findTopByTenant_IdOrderByCreatedAtDesc(UUID tenantId);
    Optional<Subscription> findByRazorpaySubscriptionId(String id);
    Optional<Subscription> findByTenant_Id(java.util.UUID tenantId);
}
