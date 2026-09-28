package com.elanjaibuildos.backend.sites.repository;

import com.elanjaibuildos.backend.sites.domain.Site;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;
import com.elanjaibuildos.backend.sites.domain.SiteStatus;

@Repository
public interface SiteRepository extends JpaRepository<Site, UUID> {
    List<Site> findByClientUserId(UUID clientUserId);

    long countByStatus(com.elanjaibuildos.backend.sites.domain.SiteStatus status);
}
