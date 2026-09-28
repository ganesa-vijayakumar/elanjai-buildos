package com.elanjaibuildos.backend.billing.repository;

import com.elanjaibuildos.backend.billing.domain.Collection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CollectionRepository extends JpaRepository<Collection, UUID> {
    List<Collection> findBySiteId(UUID siteId);
}
