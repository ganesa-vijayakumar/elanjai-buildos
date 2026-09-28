package com.elanjaibuildos.backend.materials.repository;

import com.elanjaibuildos.backend.materials.domain.ProjectMaterial;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProjectMaterialRepository extends JpaRepository<ProjectMaterial, UUID> {
    List<ProjectMaterial> findBySiteIdOrderByCategoryAscMaterialNameAsc(UUID siteId);
    List<ProjectMaterial> findBySiteIdAndStatus(UUID siteId, String status);
}
