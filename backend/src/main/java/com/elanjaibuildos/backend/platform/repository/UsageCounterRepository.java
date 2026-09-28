package com.elanjaibuildos.backend.platform.repository;

import com.elanjaibuildos.backend.platform.model.UsageCounter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UsageCounterRepository extends JpaRepository<UsageCounter, UUID> {
    Optional<UsageCounter> findByTenantIdAndMetricAndPeriodKey(UUID tenantId, String metric, String periodKey);
    List<UsageCounter> findByTenantId(UUID tenantId);
}
