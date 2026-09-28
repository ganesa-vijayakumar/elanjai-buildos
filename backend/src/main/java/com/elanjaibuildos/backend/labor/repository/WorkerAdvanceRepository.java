package com.elanjaibuildos.backend.labor.repository;

import com.elanjaibuildos.backend.labor.domain.WorkerAdvance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface WorkerAdvanceRepository extends JpaRepository<WorkerAdvance, UUID> {
    List<WorkerAdvance> findByWorkerIdOrderByDateDesc(UUID workerId);
    List<WorkerAdvance> findByStatus(String status);
}
