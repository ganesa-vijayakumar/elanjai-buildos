package com.elanjaibuildos.backend.materials.repository;

import com.elanjaibuildos.backend.materials.domain.PlanPackage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PlanPackageRepository extends JpaRepository<PlanPackage, UUID> {
    List<PlanPackage> findByIsActiveTrueOrderByRatePerSqftAsc();
    PlanPackage findByCode(String code);
}
