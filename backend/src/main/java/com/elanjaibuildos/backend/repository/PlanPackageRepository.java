package com.elanjaibuildos.backend.repository;

import com.elanjaibuildos.backend.model.PlanPackage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PlanPackageRepository extends JpaRepository<PlanPackage, UUID> {
    List<PlanPackage> findByIsActiveTrueOrderByRatePerSqftAsc();
    PlanPackage findByCode(String code);
}
