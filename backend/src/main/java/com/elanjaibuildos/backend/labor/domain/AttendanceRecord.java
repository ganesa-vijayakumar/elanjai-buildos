package com.elanjaibuildos.backend.labor.domain;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

/** Per-worker row inside a daily_attendance sheet. */
@Entity
@Table(name = "attendance_records")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceRecord {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "attendance_id")
    private DailyAttendance attendance;

    @ManyToOne(optional = false)
    @JoinColumn(name = "worker_id")
    private Worker worker;

    /** present | absent | half_day */
    @Column(nullable = false, length = 12)
    private String status;

    @Column(name = "wage_earned")
    private BigDecimal wageEarned;

    @Column(name = "overtime_hours")
    @Builder.Default
    private BigDecimal overtimeHours = BigDecimal.ZERO;

    @Column(name = "overtime_pay")
    @Builder.Default
    private BigDecimal overtimePay = BigDecimal.ZERO;
}
