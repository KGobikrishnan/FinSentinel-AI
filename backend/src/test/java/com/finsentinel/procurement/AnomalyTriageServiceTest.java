package com.finsentinel.procurement;

import com.finsentinel.ledger.DoubleEntryEngine;
import com.finsentinel.ledger.JournalEntry;
import com.finsentinel.ledger.JournalEntryRequest;
import com.finsentinel.telemetry.TelemetryBroadcaster;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnomalyTriageServiceTest {

    @Mock
    private VendorRepository vendorRepository;

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private DoubleEntryEngine doubleEntryEngine;

    @Mock
    private TelemetryBroadcaster telemetryBroadcaster;

    @InjectMocks
    private AnomalyTriageService anomalyTriageService;

    private Vendor verifiedVendor;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(anomalyTriageService, "priceVarianceThresholdPct", new BigDecimal("15.00"));
        ReflectionTestUtils.setField(anomalyTriageService, "defaultCgstRate", new BigDecimal("0.09"));
        ReflectionTestUtils.setField(anomalyTriageService, "defaultSgstRate", new BigDecimal("0.09"));
        ReflectionTestUtils.setField(anomalyTriageService, "defaultIgstRate", new BigDecimal("0.18"));

        verifiedVendor = Vendor.builder()
                .id(1L)
                .name("CloudScale Networks Inc.")
                .gstin("27AABCS1429B1Z8")
                .riskTier("LOW")
                .totalInvoiced(new BigDecimal("100000.0000"))
                .historicalAvgUnitPrice(new BigDecimal("100.0000"))
                .verified(true)
                .build();
    }

    @Test
    @DisplayName("Should auto-approve compliant invoice and post balanced ledger entry")
    void shouldAutoApproveCompliantInvoice() {
        InvoiceLineItem item = InvoiceLineItem.builder()
                .description("Cloud Nodes")
                .quantity(10)
                .unitPrice(new BigDecimal("105.00")) // Within 15% of $100 benchmark
                .totalPrice(new BigDecimal("1050.00"))
                .build();

        InvoiceCreateRequest request = InvoiceCreateRequest.builder()
                .vendorName("CloudScale Networks Inc.")
                .gstin("27AABCS1429B1Z8")
                .invoiceNumber("INV-2026-TEST-01")
                .invoiceDate(LocalDate.now())
                .subtotal(new BigDecimal("1050.00"))
                .cgst(new BigDecimal("94.50"))
                .sgst(new BigDecimal("94.50"))
                .igst(BigDecimal.ZERO)
                .totalAmount(new BigDecimal("1239.00")) // 1050 + 189 = 1239
                .lineItems(List.of(item))
                .build();

        when(vendorRepository.findByGstin(request.getGstin())).thenReturn(Optional.of(verifiedVendor));
        when(invoiceRepository.existsByVendorIdAndInvoiceNumber(verifiedVendor.getId(), request.getInvoiceNumber())).thenReturn(false);
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(invocation -> invocation.getArgument(0));

        JournalEntry mockEntry = JournalEntry.builder().id(99L).entryNumber("JE-2026-MOCK").build();
        when(doubleEntryEngine.postJournalEntry(any(JournalEntryRequest.class), anyString())).thenReturn(mockEntry);

        Invoice result = anomalyTriageService.triageAndPersist(request, "cfo_admin");

        assertThat(result.getTriageStatus()).isEqualTo(TriageStatus.AUTO_APPROVED);
        assertThat(result.getFraudRiskScore()).isLessThan(30);
        verify(doubleEntryEngine, times(1)).postJournalEntry(any(JournalEntryRequest.class), anyString());
        verifyNoInteractions(telemetryBroadcaster);
    }

    @Test
    @DisplayName("Should flag duplicate invoice number as CRITICAL_ANOMALY")
    void shouldFlagDuplicateInvoiceAsCritical() {
        InvoiceLineItem item = InvoiceLineItem.builder()
                .description("Cloud Nodes")
                .quantity(1)
                .unitPrice(new BigDecimal("100.00"))
                .totalPrice(new BigDecimal("100.00"))
                .build();

        InvoiceCreateRequest request = InvoiceCreateRequest.builder()
                .vendorName("CloudScale Networks Inc.")
                .gstin("27AABCS1429B1Z8")
                .invoiceNumber("INV-DUPLICATE-99")
                .invoiceDate(LocalDate.now())
                .subtotal(new BigDecimal("100.00"))
                .cgst(new BigDecimal("9.00"))
                .sgst(new BigDecimal("9.00"))
                .totalAmount(new BigDecimal("118.00"))
                .lineItems(List.of(item))
                .build();

        when(vendorRepository.findByGstin(request.getGstin())).thenReturn(Optional.of(verifiedVendor));
        when(invoiceRepository.existsByVendorIdAndInvoiceNumber(verifiedVendor.getId(), request.getInvoiceNumber())).thenReturn(true);
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Invoice result = anomalyTriageService.triageAndPersist(request, "cfo_admin");

        assertThat(result.getTriageStatus()).isEqualTo(TriageStatus.CRITICAL_ANOMALY);
        assertThat(result.getFraudRiskScore()).isEqualTo(100);
        assertThat(result.getAnomalyReasons()).anyMatch(reason -> reason.contains("Duplicate invoice number"));

        verify(telemetryBroadcaster, times(1)).broadcastAnomaly(any());
        verifyNoInteractions(doubleEntryEngine);
    }

    @Test
    @DisplayName("Should flag price variance when unit price exceeds historical benchmark by >15%")
    void shouldFlagPriceVariance() {
        InvoiceLineItem item = InvoiceLineItem.builder()
                .description("Overpriced Hardware")
                .quantity(1)
                .unitPrice(new BigDecimal("180.00")) // 80% higher than benchmark 100.00
                .totalPrice(new BigDecimal("180.00"))
                .build();

        InvoiceCreateRequest request = InvoiceCreateRequest.builder()
                .vendorName("CloudScale Networks Inc.")
                .gstin("27AABCS1429B1Z8")
                .invoiceNumber("INV-INFLATED-01")
                .invoiceDate(LocalDate.now())
                .subtotal(new BigDecimal("180.00"))
                .cgst(new BigDecimal("16.20"))
                .sgst(new BigDecimal("16.20"))
                .totalAmount(new BigDecimal("212.40"))
                .lineItems(List.of(item))
                .build();

        when(vendorRepository.findByGstin(request.getGstin())).thenReturn(Optional.of(verifiedVendor));
        when(invoiceRepository.existsByVendorIdAndInvoiceNumber(verifiedVendor.getId(), request.getInvoiceNumber())).thenReturn(false);
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Invoice result = anomalyTriageService.triageAndPersist(request, "cfo_admin");

        assertThat(result.getTriageStatus()).isEqualTo(TriageStatus.FLAGGED_FOR_AUDIT);
        assertThat(result.getFraudRiskScore()).isGreaterThanOrEqualTo(35);
        assertThat(result.getAnomalyReasons()).anyMatch(reason -> reason.contains("Price inflation detected"));
    }
}

