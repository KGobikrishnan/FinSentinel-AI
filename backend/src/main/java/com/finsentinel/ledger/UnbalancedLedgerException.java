package com.finsentinel.ledger;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.math.BigDecimal;

@ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
public class UnbalancedLedgerException extends RuntimeException {

    private final BigDecimal totalDebit;
    private final BigDecimal totalCredit;
    private final BigDecimal imbalance;

    public UnbalancedLedgerException(BigDecimal totalDebit, BigDecimal totalCredit) {
        super(String.format("Unbalanced journal entry rejected: Total Debit ($%s) != Total Credit ($%s). Invariant difference: $%s",
                totalDebit.toPlainString(),
                totalCredit.toPlainString(),
                totalDebit.subtract(totalCredit).abs().toPlainString()));
        this.totalDebit = totalDebit;
        this.totalCredit = totalCredit;
        this.imbalance = totalDebit.subtract(totalCredit).abs();
    }

    public BigDecimal getTotalDebit() {
        return totalDebit;
    }

    public BigDecimal getTotalCredit() {
        return totalCredit;
    }

    public BigDecimal getImbalance() {
        return imbalance;
    }
}
