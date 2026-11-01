package com.finsentinel.ledger;

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
public class TrialBalanceResponse {

    private LocalDate asOfDate;
    private BigDecimal totalDebit;
    private BigDecimal totalCredit;
    private BigDecimal netImbalance;
    private boolean isBalanced;
    private List<TrialBalanceAccountDto> accounts;
}
