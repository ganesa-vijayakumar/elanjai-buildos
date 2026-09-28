package com.elanjaibuildos.backend.sites.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import com.elanjaibuildos.backend.materials.domain.PackageName;
import com.elanjaibuildos.backend.identity.domain.User;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "sites")
@EntityListeners(AuditingEntityListener.class)
public class Site {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String siteName;

    @Column(nullable = false)
    private String clientName;

    private String clientPhone;
    private String clientEmail;

    @ManyToOne
    @JoinColumn(name = "client_user_id")
    private User clientUser;

    private String location;
    private BigDecimal builtupArea;
    private BigDecimal ratePerSqft;

    @Enumerated(EnumType.STRING)
    private PackageName packageName;

    private BigDecimal totalValue;

    /** Denormalized current stage name (site_stages rows are the source of truth). */
    private String currentStage;

    @Enumerated(EnumType.STRING)
    private SiteStatus status;

    private LocalDate startDate;
    private LocalDate expectedEndDate;
    private BigDecimal estimatedMaterialExpense;

    @ManyToOne
    @JoinColumn(name = "created_by")
    private User createdBy;

    @CreatedDate
    private LocalDateTime createdAt;
}
