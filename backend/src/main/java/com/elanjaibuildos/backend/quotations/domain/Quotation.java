package com.elanjaibuildos.backend.quotations.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import com.elanjaibuildos.backend.materials.domain.PackageName;
import com.elanjaibuildos.backend.sites.domain.Site;
import com.elanjaibuildos.backend.identity.domain.User;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "quotations")
@EntityListeners(AuditingEntityListener.class)
public class Quotation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true)
    private String quotationNumber;

    @Column(nullable = false)
    private String clientName;

    private String clientPhone;
    private String clientEmail;
    private String location;
    private BigDecimal builtupArea;
    private BigDecimal ratePerSqft;

    @Enumerated(EnumType.STRING)
    private PackageName packageName;

    private BigDecimal totalValue;

    @Column(columnDefinition = "TEXT")
    private String stageBreakdown; // JSON string

    @Enumerated(EnumType.STRING)
    private QuotationStatus status;

    @OneToOne
    @JoinColumn(name = "converted_site_id")
    private Site convertedSite;

    @ManyToOne
    @JoinColumn(name = "created_by")
    private User createdBy;

    @CreatedDate
    private LocalDateTime createdAt;
}
