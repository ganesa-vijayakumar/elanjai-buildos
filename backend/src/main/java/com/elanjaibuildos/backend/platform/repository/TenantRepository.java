package com.elanjaibuildos.backend.platform.repository;

import com.elanjaibuildos.backend.platform.model.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TenantRepository extends JpaRepository<Tenant, UUID> {
    Optional<Tenant> findBySlug(String slug);
    Optional<Tenant> findBySchemaName(String schemaName);
    List<Tenant> findByStatus(Tenant.Status status);
    boolean existsBySlug(String slug);
}
