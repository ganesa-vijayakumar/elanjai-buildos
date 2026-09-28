package com.elanjaibuildos.backend.repository;

import com.elanjaibuildos.backend.model.ProjectMaterial;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProjectMaterialRepository extends JpaRepository<ProjectMaterial, UUID> {
    List<ProjectMaterial> findBySiteIdOrderByCategoryAscMaterialNameAsc(UUID siteId);
    List<ProjectMaterial> findBySiteIdAndStatus(UUID siteId, String status);
}
