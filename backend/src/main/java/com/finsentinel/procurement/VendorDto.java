package com.finsentinel.procurement;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorDto {

    private Long id;
    private String name;
    private String gstin;
    private String taxId;
    private String riskTier;
    private BigDecimal totalInvoiced;
    private BigDecimal historicalAvgUnitPrice;
    private boolean verified;
    private OffsetDateTime createdAt;
}
