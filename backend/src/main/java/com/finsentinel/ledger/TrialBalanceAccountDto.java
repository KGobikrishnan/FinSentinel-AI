package com.finsentinel.ledger;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrialBalanceAccountDto {

    private String code;
    private String name;
    private AccountType accountType;
    private BigDecimal debitBalance;
    private BigDecimal creditBalance;
}
