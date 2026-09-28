package com.elanjaibuildos.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** Salary advance given to a worker; recovered later from wages. */
@Entity
@Table(name = "worker_advances")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkerAdvance {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "worker_id")
    private Worker worker;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false)
    private LocalDate date;

    private String reason;

    @ManyToOne
    @JoinColumn(name = "recorded_by")
    private User recordedBy;

    /** pending_recovery | recovered | waived */
    @Column(length = 20)
    @Builder.Default
    private String status = "pending_recovery";

    @Column(name = "recovered_amount")
    @Builder.Default
    private BigDecimal recoveredAmount = BigDecimal.ZERO;

    @Column(name = "recovered_at")
    private Instant recoveredAt;
}
