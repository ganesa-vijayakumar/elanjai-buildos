package com.elanjaibuildos.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "site_stages")
public class SiteStage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "site_id")
    private Site site;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private BigDecimal percentage;

    private BigDecimal budgetAmount;

    @Builder.Default
    @Column(nullable = false)
    private BigDecimal actualSpent = BigDecimal.ZERO;

    @Builder.Default
    @Column(nullable = false)
    private String status = "pending"; // pending | in_progress | done

    private LocalDate plannedStart;
    private LocalDate plannedEnd;
    private LocalDate actualStart;
    private LocalDate actualEnd;

    @Column(nullable = false)
    private Integer orderIndex;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
