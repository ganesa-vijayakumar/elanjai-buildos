package com.elanjaibuildos.backend.platform.repository;

import com.elanjaibuildos.backend.platform.model.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {
    List<Invoice> findByTenant_IdOrderByCreatedAtDesc(UUID tenantId);
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
    Optional<Invoice> findByRazorpayOrderId(String orderId);
    Optional<Invoice> findByRazorpayPaymentId(String paymentId);
}
