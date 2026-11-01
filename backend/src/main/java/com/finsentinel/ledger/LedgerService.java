package com.finsentinel.ledger;

import com.finsentinel.common.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LedgerService {

    private final DoubleEntryEngine doubleEntryEngine;
    private final AccountRepository accountRepository;
    private final JournalEntryRepository journalEntryRepository;

    @Transactional
    public JournalEntryResponse postEntry(JournalEntryRequest request, String createdBy) {
        JournalEntry entry = doubleEntryEngine.postJournalEntry(request, createdBy);
        return mapToResponse(entry);
    }

    @Transactional(readOnly = true)
    public List<JournalEntryResponse> getRecentEntries() {
        return journalEntryRepository.findTop50ByOrderByPostingDateDescIdDesc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<JournalEntryResponse> getPaginatedEntries(Pageable pageable) {
        return journalEntryRepository.findAllByOrderByPostingDateDescIdDesc(pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public JournalEntryResponse getEntryById(Long id) {
        JournalEntry entry = journalEntryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Journal entry not found with id: " + id));
        return mapToResponse(entry);
    }

    @Transactional(readOnly = true)
    public List<AccountDto> getAllAccounts() {
        return accountRepository.findAllOrderedByCode().stream()
                .map(this::mapToAccountDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TrialBalanceResponse generateTrialBalance(LocalDate asOfDate) {
        LocalDate effectiveDate = (asOfDate != null) ? asOfDate : LocalDate.now();
        List<Account> accounts = accountRepository.findByActiveTrueOrderByCodeAsc();

        BigDecimal totalDebit = BigDecimal.ZERO.setScale(Account.INTERNAL_SCALE, Account.ROUNDING_MODE);
        BigDecimal totalCredit = BigDecimal.ZERO.setScale(Account.INTERNAL_SCALE, Account.ROUNDING_MODE);

        List<TrialBalanceAccountDto> accountSummaries = new java.util.ArrayList<>();

        for (Account acc : accounts) {
            BigDecimal bal = acc.getBalance();
            BigDecimal debitBal = BigDecimal.ZERO.setScale(Account.INTERNAL_SCALE, Account.ROUNDING_MODE);
            BigDecimal creditBal = BigDecimal.ZERO.setScale(Account.INTERNAL_SCALE, Account.ROUNDING_MODE);

            if (acc.getAccountType().isDebitNormal()) {
                if (bal.compareTo(BigDecimal.ZERO) >= 0) {
                    debitBal = bal;
                } else {
                    creditBal = bal.abs();
                }
            } else {
                if (bal.compareTo(BigDecimal.ZERO) >= 0) {
                    creditBal = bal;
                } else {
                    debitBal = bal.abs();
                }
            }

            totalDebit = totalDebit.add(debitBal);
            totalCredit = totalCredit.add(creditBal);

            accountSummaries.add(TrialBalanceAccountDto.builder()
                    .code(acc.getCode())
                    .name(acc.getName())
                    .accountType(acc.getAccountType())
                    .debitBalance(debitBal.setScale(2, RoundingMode.HALF_UP))
                    .creditBalance(creditBal.setScale(2, RoundingMode.HALF_UP))
                    .build());
        }

        BigDecimal netImbalance = totalDebit.subtract(totalCredit).abs();
        boolean isBalanced = netImbalance.compareTo(BigDecimal.ZERO) == 0;

        return TrialBalanceResponse.builder()
                .asOfDate(effectiveDate)
                .totalDebit(totalDebit.setScale(2, RoundingMode.HALF_UP))
                .totalCredit(totalCredit.setScale(2, RoundingMode.HALF_UP))
                .netImbalance(netImbalance.setScale(2, RoundingMode.HALF_UP))
                .isBalanced(isBalanced)
                .accounts(accountSummaries)
                .build();
    }

    public JournalEntryResponse mapToResponse(JournalEntry entry) {
        List<JournalLineDto> lineDtos = entry.getLines().stream()
                .map(line -> JournalLineDto.builder()
                        .accountCode(line.getAccount().getCode())
                        .accountName(line.getAccount().getName())
                        .entryType(line.getEntryType())
                        .amount(line.getAmount().setScale(2, RoundingMode.HALF_UP))
                        .lineOrder(line.getLineOrder())
                        .memo(line.getMemo())
                        .build())
                .collect(Collectors.toList());

        return JournalEntryResponse.builder()
                .id(entry.getId())
                .entryNumber(entry.getEntryNumber())
                .referenceId(entry.getReferenceId())
                .postingDate(entry.getPostingDate())
                .status(entry.getStatus())
                .memo(entry.getMemo())
                .totalAmount(entry.getTotalAmount().setScale(2, RoundingMode.HALF_UP))
                .createdBy(entry.getCreatedBy())
                .createdAt(entry.getCreatedAt())
                .lines(lineDtos)
                .build();
    }

    public AccountDto mapToAccountDto(Account account) {
        return AccountDto.builder()
                .id(account.getId())
                .code(account.getCode())
                .name(account.getName())
                .accountType(account.getAccountType())
                .currency(account.getCurrency())
                .balance(account.getBalance().setScale(2, RoundingMode.HALF_UP))
                .active(account.isActive())
                .description(account.getDescription())
                .updatedAt(account.getUpdatedAt())
                .build();
    }
}
