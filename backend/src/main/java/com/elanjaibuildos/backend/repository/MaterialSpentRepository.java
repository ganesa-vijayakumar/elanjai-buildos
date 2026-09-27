package com.elanjaibuildos.backend.repository;

import com.elanjaibuildos.backend.model.MaterialSpent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface MaterialSpentRepository extends JpaRepository<MaterialSpent, UUID> {
    Optional<MaterialSpent> findBySiteIdAndMaterialType(UUID siteId,
            com.elanjaibuildos.backend.model.MaterialType materialType);
}
