package com.elanjaibuildos.backend.repository;

import com.elanjaibuildos.backend.model.Quotation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.UUID;

@Repository
public interface QuotationRepository extends JpaRepository<Quotation, UUID> {
    long countByCreatedAtAfter(LocalDateTime date);
}
