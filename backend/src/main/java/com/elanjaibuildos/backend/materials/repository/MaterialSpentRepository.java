package com.elanjaibuildos.backend.materials.repository;

import com.elanjaibuildos.backend.materials.domain.MaterialSpent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;
import com.elanjaibuildos.backend.materials.domain.MaterialType;

@Repository
public interface MaterialSpentRepository extends JpaRepository<MaterialSpent, UUID> {
    Optional<MaterialSpent> findBySiteIdAndMaterialType(UUID siteId,
            com.elanjaibuildos.backend.materials.domain.MaterialType materialType);
}
