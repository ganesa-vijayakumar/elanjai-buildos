package com.elanjaibuildos.backend.materials.repository;

import com.elanjaibuildos.backend.materials.domain.StageTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface StageTemplateRepository extends JpaRepository<StageTemplate, UUID> {
    List<StageTemplate> findAllByOrderByOrderIndexAsc();
}
