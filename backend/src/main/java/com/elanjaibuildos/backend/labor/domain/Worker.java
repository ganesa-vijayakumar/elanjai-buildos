package com.elanjaibuildos.backend.labor.domain;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import com.elanjaibuildos.backend.sites.domain.Site;
import com.elanjaibuildos.backend.platform.domain.Tenant;

/** Tenant labor worker — per-site crew member paid daily wages (F-046). */
@Entity
@Table(name = "workers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Worker {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(length = 30)
    private String phone;

    /** mason | helper | carpenter | electrician | plumber | painter | other */
    @Column(nullable = false, length = 30)
    private String type;

    @Column(name = "daily_wage", nullable = false)
    private BigDecimal dailyWage;

    @ManyToOne
    @JoinColumn(name = "project_id")
    private Site site;

    @Column(length = 16)
    @Builder.Default
    private String status = "active"; // active | inactive

    @Column(name = "advance_balance", nullable = false)
    @Builder.Default
    private BigDecimal advanceBalance = BigDecimal.ZERO;

    @Column(name = "photo_file_id")
    private UUID photoFileId;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
