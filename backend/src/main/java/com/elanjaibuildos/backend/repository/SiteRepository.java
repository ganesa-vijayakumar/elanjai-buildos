package com.elanjaibuildos.backend.repository;

import com.elanjaibuildos.backend.model.Site;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SiteRepository extends JpaRepository<Site, UUID> {
    List<Site> findByClientUserId(UUID clientUserId);

    long countByStatus(com.elanjaibuildos.backend.model.SiteStatus status);
}
