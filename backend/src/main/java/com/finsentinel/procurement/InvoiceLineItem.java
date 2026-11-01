package com.finsentinel.procurement;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceLineItem {

    private String description;
    private int quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
}
