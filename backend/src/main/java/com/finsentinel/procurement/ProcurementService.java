package com.finsentinel.procurement;

import com.finsentinel.common.ResourceNotFoundException;
import com.finsentinel.ledger.DoubleEntryEngine;
import com.finsentinel.ledger.EntryType;
import com.finsentinel.ledger.JournalEntry;
import com.finsentinel.ledger.JournalEntryRequest;
import com.finsentinel.ledger.JournalLineDto;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProcurementService {

    private static final Logger log = LoggerFactory.getLogger(ProcurementService.class);

    private final PdfParserService pdfParserService;
    private final AnomalyTriageService anomalyTriageService;
    private final InvoiceRepository invoiceRepository;
    private final VendorRepository vendorRepository;
    private final DoubleEntryEngine doubleEntryEngine;

    @Transactional
    public InvoiceResponse processPdfUpload(MultipartFile file, String createdBy) throws IOException {
        InvoiceCreateRequest parsedRequest = pdfParserService.parsePdf(file);
        Invoice invoice = anomalyTriageService.triageAndPersist(parsedRequest, createdBy);
        return mapToResponse(invoice);
    }

    @Transactional
    public InvoiceResponse processJsonInvoice(InvoiceCreateRequest request, String createdBy) {
        Invoice invoice = anomalyTriageService.triageAndPersist(request, createdBy);
        return mapToResponse(invoice);
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponse> getAllInvoices() {
        return invoiceRepository.findTop50ByOrderByCreatedAtDesc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceById(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + id));
        return mapToResponse(invoice);
    }

    @Transactional
    public InvoiceResponse applyAuditDecision(Long invoiceId, AuditDecisionRequest decisionRequest, String auditorName) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + invoiceId));

        if (invoice.getJournalEntry() != null) {
            throw new IllegalStateException("Invoice has already been settled in the general ledger.");
        }

        if (decisionRequest.getDecision() == AuditDecisionRequest.Decision.APPROVED) {
            invoice.setTriageStatus(TriageStatus.AUTO_APPROVED);
            invoice.getAnomalyReasons().add(String.format("Manual Auditor Override by %s: %s", auditorName, decisionRequest.getRationale()));

            // Post balanced double-entry
            List<JournalLineDto> lines = new ArrayList<>();
            lines.add(JournalLineDto.builder()
                    .accountCode("5010")
                    .entryType(EntryType.DEBIT)
                    .amount(invoice.getSubtotal())
                    .lineOrder(1)
                    .memo("Auditor approved procurement: " + invoice.getInvoiceNumber())
                    .build());

            BigDecimal taxAmount = invoice.getCgst().add(invoice.getSgst()).add(invoice.getIgst());
            if (taxAmount.compareTo(BigDecimal.ZERO) > 0) {
                lines.add(JournalLineDto.builder()
                        .accountCode("5030")
                        .entryType(EntryType.DEBIT)
                        .amount(taxAmount)
                        .lineOrder(2)
                        .memo("Auditor approved tax: " + invoice.getInvoiceNumber())
                        .build());
            }

            lines.add(JournalLineDto.builder()
                    .accountCode("2010")
                    .entryType(EntryType.CREDIT)
                    .amount(invoice.getTotalAmount())
                    .lineOrder(3)
                    .memo("Accounts payable liability to " + invoice.getVendor().getName())
                    .build());

            JournalEntryRequest journalRequest = JournalEntryRequest.builder()
                    .referenceId(invoice.getInvoiceNumber())
                    .postingDate(invoice.getInvoiceDate())
                    .memo("Auditor manual ledger settlement for " + invoice.getInvoiceNumber())
                    .lines(lines)
                    .build();

            JournalEntry entry = doubleEntryEngine.postJournalEntry(journalRequest, auditorName);
            invoice.setJournalEntry(entry);

            Vendor vendor = invoice.getVendor();
            vendor.setTotalInvoiced(vendor.getTotalInvoiced().add(invoice.getTotalAmount()));
            vendorRepository.save(vendor);

        } else {
            invoice.setTriageStatus(TriageStatus.CRITICAL_ANOMALY);
            invoice.getAnomalyReasons().add(String.format("REJECTED by auditor %s: %s", auditorName, decisionRequest.getRationale()));
        }

        Invoice saved = invoiceRepository.save(invoice);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<VendorDto> getAllVendors() {
        return vendorRepository.findAllByOrderByTotalInvoicedDesc().stream()
                .map(v -> VendorDto.builder()
                        .id(v.getId())
                        .name(v.getName())
                        .gstin(v.getGstin())
                        .taxId(v.getTaxId())
                        .riskTier(v.getRiskTier())
                        .totalInvoiced(v.getTotalInvoiced())
                        .historicalAvgUnitPrice(v.getHistoricalAvgUnitPrice())
                        .verified(v.isVerified())
                        .createdAt(v.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    public InvoiceResponse mapToResponse(Invoice invoice) {
        return InvoiceResponse.builder()
                .id(invoice.getId())
                .vendorId(invoice.getVendor().getId())
                .vendorName(invoice.getVendor().getName())
                .vendorRiskTier(invoice.getVendor().getRiskTier())
                .invoiceNumber(invoice.getInvoiceNumber())
                .invoiceDate(invoice.getInvoiceDate())
                .gstin(invoice.getGstin())
                .subtotal(invoice.getSubtotal())
                .cgst(invoice.getCgst())
                .sgst(invoice.getSgst())
                .igst(invoice.getIgst())
                .totalAmount(invoice.getTotalAmount())
                .lineItems(invoice.getLineItems())
                .fraudRiskScore(invoice.getFraudRiskScore())
                .triageStatus(invoice.getTriageStatus())
                .anomalyReasons(invoice.getAnomalyReasons())
                .journalEntryId(invoice.getJournalEntry() != null ? invoice.getJournalEntry().getId() : null)
                .journalEntryNumber(invoice.getJournalEntry() != null ? invoice.getJournalEntry().getEntryNumber() : null)
                .createdAt(invoice.getCreatedAt())
                .build();
    }
}
