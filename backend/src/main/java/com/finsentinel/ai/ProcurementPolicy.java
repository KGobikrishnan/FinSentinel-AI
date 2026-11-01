package com.finsentinel.ai;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "procurement_policies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcurementPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "policy_code", nullable = false, unique = true, length = 50)
    private String policyCode;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "threshold_pct", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal thresholdPct = new BigDecimal("15.00");

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = OffsetDateTime.now();
        }
    }
}
