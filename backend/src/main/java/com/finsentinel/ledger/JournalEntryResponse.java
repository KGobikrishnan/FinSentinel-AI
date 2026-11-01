package com.finsentinel.ledger;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JournalEntryResponse {

    private Long id;
    private String entryNumber;
    private String referenceId;
    private LocalDate postingDate;
    private JournalStatus status;
    private String memo;
    private BigDecimal totalAmount;
    private String createdBy;
    private OffsetDateTime createdAt;
    private List<JournalLineDto> lines;
}
