package com.elanjaibuildos.backend.materials.repository;

import com.elanjaibuildos.backend.materials.domain.Material;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MaterialRepository extends JpaRepository<Material, UUID> {
    List<Material> findByIsActiveTrueOrderByCategoryAscNameAsc();
}
