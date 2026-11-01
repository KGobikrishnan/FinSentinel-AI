package com.finsentinel.procurement;

import com.finsentinel.ledger.JournalEntry;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "invoices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    @Column(name = "invoice_number", nullable = false, length = 100)
    private String invoiceNumber;

    @Column(name = "invoice_date", nullable = false)
    private LocalDate invoiceDate;

    @Column(nullable = false, length = 50)
    private String gstin;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal subtotal;

    @Column(nullable = false, precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal cgst = BigDecimal.ZERO;

    @Column(nullable = false, precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal sgst = BigDecimal.ZERO;

    @Column(nullable = false, precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal igst = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal totalAmount;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "line_items", columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private List<InvoiceLineItem> lineItems = new ArrayList<>();

    @Column(name = "fraud_risk_score", nullable = false)
    @Builder.Default
    private int fraudRiskScore = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "triage_status", nullable = false, length = 30)
    private TriageStatus triageStatus;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "anomaly_reasons", columnDefinition = "jsonb")
    @Builder.Default
    private List<String> anomalyReasons = new ArrayList<>();

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "journal_entry_id")
    private JournalEntry journalEntry;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = OffsetDateTime.now();
        }
    }
}
