package com.elanjaibuildos.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** Per-site material line: specified → ordered → delivered → installed (F-048). */
@Entity
@Table(name = "project_materials")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectMaterial {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "project_id")
    private Site site;

    @Column(length = 40)
    private String category;

    @Column(name = "material_name", nullable = false, length = 160)
    private String materialName;

    @Column(name = "specified_brand", length = 120)
    private String specifiedBrand;

    @ManyToOne
    @JoinColumn(name = "actual_brand_id")
    private Brand actualBrand;

    @Column(name = "est_quantity")
    private BigDecimal estQuantity;

    @Column(name = "actual_quantity")
    private BigDecimal actualQuantity;

    @Column(length = 20)
    private String unit;

    /** pending | ordered | delivered | installed */
    @Column(length = 16)
    @Builder.Default
    private String status = "pending";

    /** JSON array of {status, at, by} transitions. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "status_history", columnDefinition = "jsonb")
    @Builder.Default
    private String statusHistory = "[]";

    private String notes;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
