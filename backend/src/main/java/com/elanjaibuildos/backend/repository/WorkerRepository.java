package com.elanjaibuildos.backend.repository;

import com.elanjaibuildos.backend.model.Worker;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface WorkerRepository extends JpaRepository<Worker, UUID> {
    List<Worker> findBySiteIdOrderByNameAsc(UUID siteId);
    List<Worker> findBySiteIdAndStatusOrderByNameAsc(UUID siteId, String status);
}
