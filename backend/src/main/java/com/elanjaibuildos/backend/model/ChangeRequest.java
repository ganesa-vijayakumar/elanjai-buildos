package com.elanjaibuildos.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** Scope change requested by client or raised by owner (F-051). */
@Entity
@Table(name = "change_requests")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChangeRequest {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "cr_number", nullable = false, length = 30)
    private String crNumber;

    @ManyToOne(optional = false)
    @JoinColumn(name = "project_id")
    private Site site;

    @Column(nullable = false, columnDefinition = "text")
    private String description;

    /** scope | material | design | other */
    @Column(length = 30)
    private String type;

    @Column(length = 40)
    private String category;

    @Column(name = "cost_impact")
    private BigDecimal costImpact;

    @Column(name = "timeline_impact", length = 80)
    private String timelineImpact;

    /** pending | approved | rejected | implemented */
    @Column(length = 20)
    @Builder.Default
    private String status = "pending";

    @Column(name = "reference_image_id")
    private UUID referenceImageId;

    @Column(name = "approver_notes", columnDefinition = "text")
    private String approverNotes;

    /** client | owner */
    @Column(name = "requested_by", nullable = false, length = 10)
    @Builder.Default
    private String requestedBy = "client";

    @ManyToOne
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();
}
