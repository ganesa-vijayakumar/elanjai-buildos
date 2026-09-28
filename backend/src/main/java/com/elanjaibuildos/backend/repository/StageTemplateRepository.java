package com.elanjaibuildos.backend.repository;

import com.elanjaibuildos.backend.model.StageTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface StageTemplateRepository extends JpaRepository<StageTemplate, UUID> {
    List<StageTemplate> findAllByOrderByOrderIndexAsc();
}
