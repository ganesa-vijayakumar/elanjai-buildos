package com.elanjaibuildos.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/** Progress photo on a site, optionally tagged to a construction stage (F-052). */
@Entity
@Table(name = "site_photos")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SitePhoto {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "site_id")
    private Site site;

    @ManyToOne
    @JoinColumn(name = "stage_id")
    private SiteStage stage;

    @ManyToOne(optional = false)
    @JoinColumn(name = "file_id")
    private FileRef file;

    @Column(length = 240)
    private String caption;

    @ManyToOne
    @JoinColumn(name = "uploaded_by")
    private User uploadedBy;

    @Column(name = "uploaded_at", nullable = false)
    @Builder.Default
    private Instant uploadedAt = Instant.now();
}
