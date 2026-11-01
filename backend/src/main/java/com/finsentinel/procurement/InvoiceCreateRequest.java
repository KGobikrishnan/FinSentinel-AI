package com.finsentinel.procurement;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceCreateRequest {

    private String vendorName;

    @NotBlank(message = "Invoice number is required")
    private String invoiceNumber;

    @NotNull(message = "Invoice date is required")
    private LocalDate invoiceDate;

    @NotBlank(message = "Vendor GSTIN is required")
    private String gstin;

    @NotNull(message = "Subtotal is required")
    @DecimalMin(value = "0.01", message = "Subtotal must be positive")
    private BigDecimal subtotal;

    private BigDecimal cgst;
    private BigDecimal sgst;
    private BigDecimal igst;

    @NotNull(message = "Total amount is required")
    @DecimalMin(value = "0.01", message = "Total amount must be positive")
    private BigDecimal totalAmount;

    @NotEmpty(message = "At least one line item is required")
    private List<InvoiceLineItem> lineItems;
}
