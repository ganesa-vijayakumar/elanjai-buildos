package com.elanjaibuildos.backend.repository;

import com.elanjaibuildos.backend.model.Material;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MaterialRepository extends JpaRepository<Material, UUID> {
    List<Material> findByIsActiveTrueOrderByCategoryAscNameAsc();
}
