package com.elanjaibuildos.backend.materials.repository;

import com.elanjaibuildos.backend.materials.domain.Brand;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BrandRepository extends JpaRepository<Brand, UUID> {
    List<Brand> findByIsActiveTrueOrderByNameAsc();
}
