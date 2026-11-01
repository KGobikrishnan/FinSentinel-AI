package com.finsentinel.procurement;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findByVendorIdAndInvoiceNumber(Long vendorId, String invoiceNumber);

    boolean existsByVendorIdAndInvoiceNumber(Long vendorId, String invoiceNumber);

    List<Invoice> findTop50ByOrderByCreatedAtDesc();

    Page<Invoice> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<Invoice> findByTriageStatusOrderByCreatedAtDesc(TriageStatus status);

    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.fraudRiskScore >= :minRiskScore")
    long countAnomalies(@Param("minRiskScore") int minRiskScore);

    @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM Invoice i WHERE i.triageStatus = 'AUTO_APPROVED'")
    BigDecimal sumApprovedInvoicedAmount();

    @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM Invoice i WHERE i.triageStatus IN ('FLAGGED_FOR_AUDIT', 'CRITICAL_ANOMALY')")
    BigDecimal sumHighRiskExposure();
}
