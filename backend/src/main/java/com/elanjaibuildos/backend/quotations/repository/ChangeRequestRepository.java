package com.elanjaibuildos.backend.quotations.repository;

import com.elanjaibuildos.backend.quotations.domain.ChangeRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ChangeRequestRepository extends JpaRepository<ChangeRequest, UUID> {
    List<ChangeRequest> findBySiteIdOrderByCreatedAtDesc(UUID siteId);
    List<ChangeRequest> findBySiteIdAndStatus(UUID siteId, String status);
    long countBySiteId(UUID siteId);
}
