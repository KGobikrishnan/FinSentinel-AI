package com.finsentinel.ledger;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "journal_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JournalEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "entry_number", nullable = false, unique = true, length = 100)
    private String entryNumber;

    @Column(name = "reference_id", length = 100)
    private String referenceId;

    @Column(name = "posting_date", nullable = false)
    private LocalDate postingDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private JournalStatus status = JournalStatus.POSTED;

    @Column(columnDefinition = "TEXT")
    private String memo;

    @Column(name = "total_amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal totalAmount;

    @Column(name = "created_by", nullable = false, length = 100)
    private String createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @OneToMany(mappedBy = "journalEntry", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("lineOrder ASC")
    @Builder.Default
    private List<JournalLine> lines = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = OffsetDateTime.now();
        }
        if (this.postingDate == null) {
            this.postingDate = LocalDate.now();
        }
    }

    public void addLine(JournalLine line) {
        lines.add(line);
        line.setJournalEntry(this);
    }
}
