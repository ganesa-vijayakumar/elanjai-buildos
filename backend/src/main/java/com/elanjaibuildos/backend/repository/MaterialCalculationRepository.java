package com.elanjaibuildos.backend.repository;

import com.elanjaibuildos.backend.model.MaterialCalculation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MaterialCalculationRepository extends JpaRepository<MaterialCalculation, UUID> {
    List<MaterialCalculation> findBySiteIdOrderByCalculatedAtDesc(UUID siteId);
    List<MaterialCalculation> findAllByOrderByCalculatedAtDesc();
}
