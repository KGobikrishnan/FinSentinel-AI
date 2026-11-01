package com.finsentinel.ledger;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JournalEntryRequest {

    private String referenceId;

    @NotNull(message = "Posting date is required")
    private LocalDate postingDate;

    private String memo;

    @NotEmpty(message = "Journal entry must contain at least two journal lines")
    @Valid
    private List<JournalLineDto> lines;
}
