package com.finsentinel.ledger;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JournalLineDto {

    @NotBlank(message = "Account code is required")
    private String accountCode;

    private String accountName;

    @NotNull(message = "Entry type (DEBIT or CREDIT) is required")
    private EntryType entryType;

    @NotNull(message = "Line amount is required")
    @DecimalMin(value = "0.0001", message = "Line amount must be greater than zero")
    private BigDecimal amount;

    private int lineOrder;
    private String memo;
}
