package com.elanjaibuildos.backend.labor.repository;

import com.elanjaibuildos.backend.labor.domain.DailyAttendance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DailyAttendanceRepository extends JpaRepository<DailyAttendance, UUID> {
    Optional<DailyAttendance> findBySiteIdAndDate(UUID siteId, LocalDate date);
    List<DailyAttendance> findBySiteIdAndDateBetweenOrderByDateDesc(UUID siteId, LocalDate from, LocalDate to);
}
