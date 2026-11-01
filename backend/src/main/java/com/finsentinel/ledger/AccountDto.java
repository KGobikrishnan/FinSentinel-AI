package com.finsentinel.ledger;

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
public class AccountDto {

    private Long id;
    private String code;
    private String name;
    private AccountType accountType;
    private String currency;
    private BigDecimal balance;
    private boolean active;
    private String description;
    private OffsetDateTime updatedAt;
}
