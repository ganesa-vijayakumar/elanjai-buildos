package com.elanjaibuildos.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** One attendance sheet per site per day; rows live in attendance_records. */
@Entity
@Table(name = "daily_attendance")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyAttendance {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private LocalDate date;

    @ManyToOne(optional = false)
    @JoinColumn(name = "project_id")
    private Site site;

    @ManyToOne
    @JoinColumn(name = "marked_by")
    private User markedBy;

    @Column(name = "marked_at", nullable = false)
    @Builder.Default
    private Instant markedAt = Instant.now();

    private String notes;
}
