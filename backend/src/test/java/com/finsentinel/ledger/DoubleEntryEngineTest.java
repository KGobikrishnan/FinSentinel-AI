package com.finsentinel.ledger;

import com.finsentinel.common.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DoubleEntryEngineTest {

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private JournalEntryRepository journalEntryRepository;

    @InjectMocks
    private DoubleEntryEngine doubleEntryEngine;

    private Account cashAccount;
    private Account expenseAccount;

    @BeforeEach
    void setUp() {
        cashAccount = Account.builder()
                .id(1L)
                .code("1010")
                .name("Cash")
                .accountType(AccountType.ASSET)
                .balance(new BigDecimal("50000.0000"))
                .active(true)
                .build();

        expenseAccount = Account.builder()
                .id(2L)
                .code("5010")
                .name("Procurement Expense")
                .accountType(AccountType.EXPENSE)
                .balance(new BigDecimal("10000.0000"))
                .active(true)
                .build();
    }

    @Test
    @DisplayName("Should post balanced journal entry successfully when Debit equals Credit")
    void shouldPostBalancedJournalEntry() {
        JournalLineDto debitLine = JournalLineDto.builder()
                .accountCode("5010")
                .entryType(EntryType.DEBIT)
                .amount(new BigDecimal("1500.0000"))
                .lineOrder(1)
                .memo("Office Supplies Expense")
                .build();

        JournalLineDto creditLine = JournalLineDto.builder()
                .accountCode("1010")
                .entryType(EntryType.CREDIT)
                .amount(new BigDecimal("1500.0000"))
                .lineOrder(2)
                .memo("Paid from Cash")
                .build();

        JournalEntryRequest request = JournalEntryRequest.builder()
                .referenceId("REF-TEST-001")
                .postingDate(LocalDate.now())
                .memo("Test balanced posting")
                .lines(List.of(debitLine, creditLine))
                .build();

        when(accountRepository.findByCode("5010")).thenReturn(Optional.of(expenseAccount));
        when(accountRepository.findByCode("1010")).thenReturn(Optional.of(cashAccount));
        when(journalEntryRepository.save(any(JournalEntry.class))).thenAnswer(invocation -> invocation.getArgument(0));

        JournalEntry result = doubleEntryEngine.postJournalEntry(request, "test_auditor");

        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(JournalStatus.POSTED);
        assertThat(result.getTotalAmount()).isEqualByComparingTo(new BigDecimal("1500.0000"));
        assertThat(result.getLines()).hasSize(2);

        // Verify account mutations
        verify(accountRepository, times(1)).save(expenseAccount);
        verify(accountRepository, times(1)).save(cashAccount);
        verify(journalEntryRepository, times(1)).save(any(JournalEntry.class));
    }

    @Test
    @DisplayName("Should reject unbalanced journal entry when Debit does not equal Credit")
    void shouldThrowUnbalancedLedgerException() {
        JournalLineDto debitLine = JournalLineDto.builder()
                .accountCode("5010")
                .entryType(EntryType.DEBIT)
                .amount(new BigDecimal("2000.0000"))
                .lineOrder(1)
                .build();

        JournalLineDto creditLine = JournalLineDto.builder()
                .accountCode("1010")
                .entryType(EntryType.CREDIT)
                .amount(new BigDecimal("1500.0000"))
                .lineOrder(2)
                .build();

        JournalEntryRequest request = JournalEntryRequest.builder()
                .referenceId("REF-TEST-002")
                .lines(List.of(debitLine, creditLine))
                .build();

        assertThatThrownBy(() -> doubleEntryEngine.postJournalEntry(request, "test_auditor"))
                .isInstanceOf(UnbalancedLedgerException.class)
                .hasMessageContaining("Unbalanced journal entry rejected");

        verifyNoInteractions(accountRepository);
        verifyNoInteractions(journalEntryRepository);
    }

    @Test
    @DisplayName("Should throw IllegalArgumentException when less than 2 lines provided")
    void shouldThrowExceptionWhenInsufficientLines() {
        JournalLineDto singleLine = JournalLineDto.builder()
                .accountCode("5010")
                .entryType(EntryType.DEBIT)
                .amount(new BigDecimal("500.0000"))
                .build();

        JournalEntryRequest request = JournalEntryRequest.builder()
                .lines(List.of(singleLine))
                .build();

        assertThatThrownBy(() -> doubleEntryEngine.postJournalEntry(request, "test_auditor"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("at least 2 journal lines");
    }

    @Test
    @DisplayName("Should reject posting to inactive ledger account")
    void shouldRejectInactiveAccount() {
        cashAccount.setActive(false);

        JournalLineDto debitLine = JournalLineDto.builder()
                .accountCode("5010")
                .entryType(EntryType.DEBIT)
                .amount(new BigDecimal("1000.0000"))
                .build();

        JournalLineDto creditLine = JournalLineDto.builder()
                .accountCode("1010")
                .entryType(EntryType.CREDIT)
                .amount(new BigDecimal("1000.0000"))
                .build();

        JournalEntryRequest request = JournalEntryRequest.builder()
                .lines(List.of(debitLine, creditLine))
                .build();

        when(accountRepository.findByCode("5010")).thenReturn(Optional.of(expenseAccount));
        when(accountRepository.findByCode("1010")).thenReturn(Optional.of(cashAccount));

        assertThatThrownBy(() -> doubleEntryEngine.postJournalEntry(request, "test_auditor"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot post entry to inactive account");
    }
}
