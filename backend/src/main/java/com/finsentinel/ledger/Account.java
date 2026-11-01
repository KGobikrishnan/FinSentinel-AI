package com.finsentinel.ledger;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;

@Entity
@Table(name = "accounts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Account {

    public static final int INTERNAL_SCALE = 4;
    public static final RoundingMode ROUNDING_MODE = RoundingMode.HALF_UP;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 150)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "account_type", nullable = false, length = 30)
    private AccountType accountType;

    @Column(nullable = false, length = 10)
    @Builder.Default
    private String currency = "USD";

    @Column(nullable = false, precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal balance = BigDecimal.ZERO.setScale(INTERNAL_SCALE, ROUNDING_MODE);

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(length = 255)
    private String description;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        OffsetDateTime now = OffsetDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.balance == null) {
            this.balance = BigDecimal.ZERO.setScale(INTERNAL_SCALE, ROUNDING_MODE);
        } else {
            this.balance = this.balance.setScale(INTERNAL_SCALE, ROUNDING_MODE);
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    public void applyMutation(EntryType entryType, BigDecimal amount) {
        BigDecimal normalizedAmount = amount.setScale(INTERNAL_SCALE, ROUNDING_MODE);
        if (accountType.isDebitNormal()) {
            if (entryType == EntryType.DEBIT) {
                this.balance = this.balance.add(normalizedAmount);
            } else {
                this.balance = this.balance.subtract(normalizedAmount);
            }
        } else {
            if (entryType == EntryType.CREDIT) {
                this.balance = this.balance.add(normalizedAmount);
            } else {
                this.balance = this.balance.subtract(normalizedAmount);
            }
        }
    }
}
