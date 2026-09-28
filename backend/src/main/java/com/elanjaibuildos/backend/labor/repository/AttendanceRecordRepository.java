package com.elanjaibuildos.backend.labor.repository;

import com.elanjaibuildos.backend.labor.domain.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, UUID> {
    List<AttendanceRecord> findByAttendanceId(UUID attendanceId);
    List<AttendanceRecord> findByWorkerId(UUID workerId);
}
