package com.finsentinel.procurement;

import com.finsentinel.ledger.*;
import com.finsentinel.telemetry.AnomalyAlertPayload;
import com.finsentinel.telemetry.TelemetryBroadcaster;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AnomalyTriageService {

    private static final Logger log = LoggerFactory.getLogger(AnomalyTriageService.class);
    private static final RoundingMode ROUNDING = RoundingMode.HALF_UP;

    private final VendorRepository vendorRepository;
    private final InvoiceRepository invoiceRepository;
    private final DoubleEntryEngine doubleEntryEngine;
    private final TelemetryBroadcaster telemetryBroadcaster;

    @Value("${finsentinel.procurement.price-variance-threshold-pct:15.00}")
    private BigDecimal priceVarianceThresholdPct;

    @Transactional
    public Invoice triageAndPersist(InvoiceCreateRequest request, String createdBy) {
        log.info("Initiating AI fraud triage for invoice {} from vendor {}", request.getInvoiceNumber(), request.getVendorName());

        // 1. Resolve or create Vendor
        Vendor vendor = resolveVendor(request);

        int riskScore = 0;
        List<String> anomalyReasons = new ArrayList<>();

        // 2. Duplicate Invoice Interception Check
        boolean isDuplicate = invoiceRepository.existsByVendorIdAndInvoiceNumber(vendor.getId(), request.getInvoiceNumber());
        if (isDuplicate) {
            riskScore += 100;
            anomalyReasons.add("CRITICAL: Duplicate invoice number '" + request.getInvoiceNumber() + "' intercepted for vendor '" + vendor.getName() + "'.");
        }

        // 3. Price Inflation & Historical Benchmark Analysis
        BigDecimal histBenchmark = vendor.getHistoricalAvgUnitPrice();
        if (histBenchmark != null && histBenchmark.compareTo(BigDecimal.ZERO) > 0 && request.getLineItems() != null) {
            for (InvoiceLineItem item : request.getLineItems()) {
                if (item.getUnitPrice() != null && item.getUnitPrice().compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal unitPrice = item.getUnitPrice().setScale(4, ROUNDING);
                    if (unitPrice.compareTo(histBenchmark) > 0) {
                        BigDecimal diff = unitPrice.subtract(histBenchmark);
                        BigDecimal variancePct = diff.divide(histBenchmark, 4, ROUNDING).multiply(BigDecimal.valueOf(100));

                        if (variancePct.compareTo(priceVarianceThresholdPct) > 0) {
                            riskScore += 35;
                            anomalyReasons.add(String.format("Price inflation detected: Line item '%s' unit price $%s represents a %.1f%% variance exceeding historical benchmark of $%s (threshold: %.1f%%).",
                                    item.getDescription(), unitPrice.setScale(2, ROUNDING), variancePct.setScale(1, ROUNDING), histBenchmark.setScale(2, ROUNDING), priceVarianceThresholdPct));
                        }
                    }
                }
            }
        }

        // 4. Statutory Tax & GST Invariance Verification
        BigDecimal subtotal = request.getSubtotal().setScale(2, ROUNDING);
        BigDecimal cgst = (request.getCgst() != null ? request.getCgst() : BigDecimal.ZERO).setScale(2, ROUNDING);
        BigDecimal sgst = (request.getSgst() != null ? request.getSgst() : BigDecimal.ZERO).setScale(2, ROUNDING);
        BigDecimal igst = (request.getIgst() != null ? request.getIgst() : BigDecimal.ZERO).setScale(2, ROUNDING);
        BigDecimal declaredTax = cgst.add(sgst).add(igst);
        BigDecimal expectedTax = subtotal.multiply(new BigDecimal("0.18")).setScale(2, ROUNDING);

        BigDecimal taxDiscrepancy = declaredTax.subtract(expectedTax).abs();
        if (taxDiscrepancy.compareTo(new BigDecimal("0.50")) > 0) {
            riskScore += 45;
            anomalyReasons.add(String.format("Statutory GST discrepancy: Total declared tax ($%s) deviates from expected 18%% GST ($%s) by $%s.",
                    declaredTax, expectedTax, taxDiscrepancy));
        }

        // 5. Vendor Risk Profile Evaluation
        if ("HIGH".equalsIgnoreCase(vendor.getRiskTier())) {
            riskScore += 25;
            anomalyReasons.add("Vendor has an elevated HIGH risk security tier.");
        } else if ("CRITICAL".equalsIgnoreCase(vendor.getRiskTier()) || !vendor.isVerified()) {
            riskScore += 50;
            anomalyReasons.add("Vendor is unverified or classified as CRITICAL risk.");
        }

        int finalScore = Math.min(100, Math.max(0, riskScore));

        // 6. Classification
        TriageStatus triageStatus;
        if (finalScore >= 75 || isDuplicate) {
            triageStatus = TriageStatus.CRITICAL_ANOMALY;
        } else if (finalScore >= 30) {
            triageStatus = TriageStatus.FLAGGED_FOR_AUDIT;
        } else {
            triageStatus = TriageStatus.AUTO_APPROVED;
        }

        Invoice invoice = Invoice.builder()
                .vendor(vendor)
                .invoiceNumber(request.getInvoiceNumber())
                .invoiceDate(request.getInvoiceDate() != null ? request.getInvoiceDate() : LocalDate.now())
                .gstin(request.getGstin())
                .subtotal(subtotal)
                .cgst(cgst)
                .sgst(sgst)
                .igst(igst)
                .totalAmount(request.getTotalAmount().setScale(2, ROUNDING))
                .lineItems(request.getLineItems())
                .fraudRiskScore(finalScore)
                .triageStatus(triageStatus)
                .anomalyReasons(anomalyReasons)
                .build();

        Invoice savedInvoice = invoiceRepository.save(invoice);

        // 7. Workflow Actions based on Triage Status
        if (triageStatus == TriageStatus.FLAGGED_FOR_AUDIT || triageStatus == TriageStatus.CRITICAL_ANOMALY) {
            // Real-Time WebSocket Telemetry Alert Broadcast
            AnomalyAlertPayload alert = AnomalyAlertPayload.builder()
                    .invoiceId(savedInvoice.getId())
                    .invoiceNumber(savedInvoice.getInvoiceNumber())
                    .vendorName(vendor.getName())
                    .amount(savedInvoice.getTotalAmount())
                    .fraudRiskScore(finalScore)
                    .triageStatus(triageStatus)
                    .anomalyReasons(anomalyReasons)
                    .timestamp(OffsetDateTime.now())
                    .build();
            telemetryBroadcaster.broadcastAnomaly(alert);
        } else {
            // AUTO_APPROVED: Automatically execute balanced double-entry ledger posting
            JournalEntry journalEntry = autoPostLedgerEntry(savedInvoice, createdBy);
            savedInvoice.setJournalEntry(journalEntry);
            savedInvoice = invoiceRepository.save(savedInvoice);

            // Update vendor total invoiced and benchmark
            vendor.setTotalInvoiced(vendor.getTotalInvoiced().add(savedInvoice.getTotalAmount()));
            vendorRepository.save(vendor);
        }

        return savedInvoice;
    }

    private JournalEntry autoPostLedgerEntry(Invoice invoice, String createdBy) {
        log.info("Auto-posting balanced double-entry for approved invoice {}", invoice.getInvoiceNumber());

        List<JournalLineDto> lines = new ArrayList<>();

        // DEBIT Expense (5010 for general procurement)
        lines.add(JournalLineDto.builder()
                .accountCode("5010")
                .entryType(EntryType.DEBIT)
                .amount(invoice.getSubtotal())
                .lineOrder(1)
                .memo("Procurement expense: " + invoice.getInvoiceNumber())
                .build());

        // DEBIT Tax (5030 for GST/Statutory tax) if tax > 0
        BigDecimal taxAmount = invoice.getCgst().add(invoice.getSgst()).add(invoice.getIgst());
        if (taxAmount.compareTo(BigDecimal.ZERO) > 0) {
            lines.add(JournalLineDto.builder()
                    .accountCode("5030")
                    .entryType(EntryType.DEBIT)
                    .amount(taxAmount)
                    .lineOrder(2)
                    .memo("Statutory tax on invoice: " + invoice.getInvoiceNumber())
                    .build());
        }

        // CREDIT Accounts Payable (2010) for Total Amount
        lines.add(JournalLineDto.builder()
                .accountCode("2010")
                .entryType(EntryType.CREDIT)
                .amount(invoice.getTotalAmount())
                .lineOrder(3)
                .memo("Accounts payable liability to " + invoice.getVendor().getName())
                .build());

        JournalEntryRequest request = JournalEntryRequest.builder()
                .referenceId(invoice.getInvoiceNumber())
                .postingDate(invoice.getInvoiceDate())
                .memo("Automated AI triage ledger settlement for " + invoice.getInvoiceNumber())
                .lines(lines)
                .build();

        return doubleEntryEngine.postJournalEntry(request, createdBy != null ? createdBy : "AI_AUTO_TRIAGE");
    }

    private Vendor resolveVendor(InvoiceCreateRequest request) {
        if (request.getGstin() != null && !request.getGstin().isBlank()) {
            var existingByGstin = vendorRepository.findByGstin(request.getGstin());
            if (existingByGstin.isPresent()) {
                return existingByGstin.get();
            }
        }

        String vendorName = request.getVendorName() != null ? request.getVendorName() : "External Supplier";
        var existingByName = vendorRepository.findByNameIgnoreCase(vendorName);
        if (existingByName.isPresent()) {
            return existingByName.get();
        }

        // Register new vendor
        Vendor newVendor = Vendor.builder()
                .name(vendorName)
                .gstin(request.getGstin() != null ? request.getGstin() : "UNREGISTERED-" + System.currentTimeMillis())
                .taxId("AUTO-" + System.currentTimeMillis())
                .riskTier("MEDIUM")
                .totalInvoiced(BigDecimal.ZERO)
                .historicalAvgUnitPrice(request.getSubtotal())
                .verified(false)
                .build();

        return vendorRepository.save(newVendor);
    }
}
