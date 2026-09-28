package com.elanjaibuildos.backend.materials.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;
import com.elanjaibuildos.backend.sites.domain.Site;
import com.elanjaibuildos.backend.identity.domain.User;

/** Saved material-estimator run (dimensions in, quantities out — F-047). */
@Entity
@Table(name = "material_calculations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaterialCalculation {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "project_id")
    private Site site;

    /** brick_wall | plaster | concrete | flooring | paint | rcc_slab */
    @Column(name = "task_type", nullable = false, length = 40)
    private String taskType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private String dimensions;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private String results;

    @ManyToOne
    @JoinColumn(name = "calculated_by")
    private User calculatedBy;

    @Column(name = "calculated_at", nullable = false)
    @Builder.Default
    private Instant calculatedAt = Instant.now();
}
