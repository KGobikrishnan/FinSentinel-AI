package com.finsentinel.ledger;

import com.finsentinel.common.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DoubleEntryEngine {

    private static final Logger log = LoggerFactory.getLogger(DoubleEntryEngine.class);
    private static final int SCALE = Account.INTERNAL_SCALE;
    private static final RoundingMode ROUNDING = Account.ROUNDING_MODE;

    private final AccountRepository accountRepository;
    private final JournalEntryRepository journalEntryRepository;

    @Transactional(isolation = Isolation.SERIALIZABLE, rollbackFor = Exception.class)
    public JournalEntry postJournalEntry(JournalEntryRequest request, String createdBy) {
        log.info("Initiating atomic double-entry posting requested by {}", createdBy);

        if (request.getLines() == null || request.getLines().size() < 2) {
            throw new IllegalArgumentException("A valid double-entry posting requires at least 2 journal lines.");
        }

        BigDecimal totalDebit = BigDecimal.ZERO.setScale(SCALE, ROUNDING);
        BigDecimal totalCredit = BigDecimal.ZERO.setScale(SCALE, ROUNDING);

        for (JournalLineDto line : request.getLines()) {
            if (line.getAmount() == null || line.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("All journal line amounts must be strictly positive.");
            }
            BigDecimal scaledAmount = line.getAmount().setScale(SCALE, ROUNDING);
            if (line.getEntryType() == EntryType.DEBIT) {
                totalDebit = totalDebit.add(scaledAmount);
            } else if (line.getEntryType() == EntryType.CREDIT) {
                totalCredit = totalCredit.add(scaledAmount);
            } else {
                throw new IllegalArgumentException("Unsupported entry type: " + line.getEntryType());
            }
        }

        // Strict Invariant Check: SUM(DEBIT) == SUM(CREDIT)
        if (totalDebit.compareTo(totalCredit) != 0) {
            log.error("Ledger invariant violation: Total Debit = {} vs Total Credit = {}", totalDebit, totalCredit);
            throw new UnbalancedLedgerException(totalDebit, totalCredit);
        }

        // Generate unique entry number
        String datePrefix = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String entryNumber = String.format("JE-%s-%s", datePrefix, UUID.randomUUID().toString().substring(0, 8).toUpperCase());

        JournalEntry entry = JournalEntry.builder()
                .entryNumber(entryNumber)
                .referenceId(request.getReferenceId())
                .postingDate(request.getPostingDate() != null ? request.getPostingDate() : LocalDate.now())
                .status(JournalStatus.POSTED)
                .memo(request.getMemo())
                .totalAmount(totalDebit)
                .createdBy(createdBy)
                .lines(new ArrayList<>())
                .build();

        int order = 1;
        for (JournalLineDto lineDto : request.getLines()) {
            Account account = accountRepository.findByCode(lineDto.getAccountCode())
                    .orElseThrow(() -> new ResourceNotFoundException("Ledger account not found with code: " + lineDto.getAccountCode()));

            if (!account.isActive()) {
                throw new IllegalStateException("Cannot post entry to inactive account: " + account.getCode());
            }

            BigDecimal lineAmount = lineDto.getAmount().setScale(SCALE, ROUNDING);

            // Apply strict double-entry balance mutation
            account.applyMutation(lineDto.getEntryType(), lineAmount);
            accountRepository.save(account);

            JournalLine line = JournalLine.builder()
                    .journalEntry(entry)
                    .account(account)
                    .entryType(lineDto.getEntryType())
                    .amount(lineAmount)
                    .lineOrder(order++)
                    .memo(lineDto.getMemo() != null ? lineDto.getMemo() : entry.getMemo())
                    .build();

            entry.addLine(line);
        }

        JournalEntry savedEntry = journalEntryRepository.save(entry);
        log.info("Successfully posted balanced journal entry {} with total amount {}", entryNumber, totalDebit);
        return savedEntry;
    }
}
