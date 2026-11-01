package com.finsentinel.procurement;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceResponse {

    private Long id;
    private Long vendorId;
    private String vendorName;
    private String vendorRiskTier;
    private String invoiceNumber;
    private LocalDate invoiceDate;
    private String gstin;
    private BigDecimal subtotal;
    private BigDecimal cgst;
    private BigDecimal sgst;
    private BigDecimal igst;
    private BigDecimal totalAmount;
    private List<InvoiceLineItem> lineItems;
    private int fraudRiskScore;
    private TriageStatus triageStatus;
    private List<String> anomalyReasons;
    private Long journalEntryId;
    private String journalEntryNumber;
    private OffsetDateTime createdAt;
}
