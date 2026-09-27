package com.elanjaibuildos.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.GenericGenerator;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "settings")
@EntityListeners(AuditingEntityListener.class)
public class Setting {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @Column(unique = true, nullable = false, name = "`key`") // Key is a reserved word in MySQL
    private String key;

    @Column(columnDefinition = "TEXT")
    private String value; // JSON string

    @ManyToOne
    @JoinColumn(name = "updated_by")
    private User updatedBy;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
