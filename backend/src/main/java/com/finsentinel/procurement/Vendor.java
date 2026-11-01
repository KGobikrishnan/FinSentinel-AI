package com.finsentinel.procurement;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "vendors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vendor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false, unique = true, length = 50)
    private String gstin;

    @Column(name = "tax_id", length = 50)
    private String taxId;

    @Column(name = "risk_tier", nullable = false, length = 30)
    @Builder.Default
    private String riskTier = "LOW"; // LOW, MEDIUM, HIGH, CRITICAL

    @Column(name = "total_invoiced", nullable = false, precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal totalInvoiced = BigDecimal.ZERO;

    @Column(name = "historical_avg_unit_price", nullable = false, precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal historicalAvgUnitPrice = BigDecimal.ZERO;

    @Column(name = "is_verified", nullable = false)
    @Builder.Default
    private boolean verified = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = OffsetDateTime.now();
        }
    }
}
