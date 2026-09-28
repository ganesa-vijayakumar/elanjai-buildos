package com.elanjaibuildos.backend.repository;

import com.elanjaibuildos.backend.model.SiteStage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SiteStageRepository extends JpaRepository<SiteStage, UUID> {
    List<SiteStage> findBySiteIdOrderByOrderIndexAsc(UUID siteId);
    long countBySiteId(UUID siteId);
}
