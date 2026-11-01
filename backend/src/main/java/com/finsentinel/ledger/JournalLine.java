package com.finsentinel.ledger;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "journal_lines")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JournalLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "entry_id", nullable = false)
    @JsonIgnore
    private JournalEntry journalEntry;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Enumerated(EnumType.STRING)
    @Column(name = "entry_type", nullable = false, length = 20)
    private EntryType entryType;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;

    @Column(name = "line_order", nullable = false)
    @Builder.Default
    private int lineOrder = 0;

    @Column(length = 255)
    private String memo;
}
