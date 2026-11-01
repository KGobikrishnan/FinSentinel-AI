package com.finsentinel.ledger;

import com.finsentinel.auth.User;
import com.finsentinel.common.AuditedAction;
import com.finsentinel.common.Idempotent;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/ledger")
@RequiredArgsConstructor
@Tag(name = "Double-Entry Ledger Engine", description = "High-concurrency balanced ledger transactions, trial balance, and account management")
public class LedgerController {

    private final LedgerService ledgerService;

    @PostMapping("/entries")
    @Idempotent(expireSeconds = 86400)
    @AuditedAction(action = "POST_JOURNAL_ENTRY", entity = "JOURNAL_ENTRY")
    @PreAuthorize("hasAnyRole('ROLE_CFO_ADMIN', 'ROLE_FINANCE_AUDITOR')")
    @Operation(summary = "Post an atomic balanced double-entry journal with idempotency lock")
    public ResponseEntity<JournalEntryResponse> postJournalEntry(
            @Valid @RequestBody JournalEntryRequest request,
            @AuthenticationPrincipal User user) {
        String createdBy = user != null ? user.getUsername() : "SYSTEM";
        JournalEntryResponse response = ledgerService.postEntry(request, createdBy);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/entries")
    @PreAuthorize("hasAnyRole('ROLE_CFO_ADMIN', 'ROLE_FINANCE_AUDITOR', 'ROLE_PROCUREMENT_MANAGER')")
    @Operation(summary = "List recent journal entries")
    public ResponseEntity<List<JournalEntryResponse>> getRecentEntries() {
        return ResponseEntity.ok(ledgerService.getRecentEntries());
    }

    @GetMapping("/entries/{id}")
    @PreAuthorize("hasAnyRole('ROLE_CFO_ADMIN', 'ROLE_FINANCE_AUDITOR', 'ROLE_PROCUREMENT_MANAGER')")
    @Operation(summary = "Get journal entry detail by ID")
    public ResponseEntity<JournalEntryResponse> getEntryById(@PathVariable Long id) {
        return ResponseEntity.ok(ledgerService.getEntryById(id));
    }

    @GetMapping("/accounts")
    @PreAuthorize("hasAnyRole('ROLE_CFO_ADMIN', 'ROLE_FINANCE_AUDITOR', 'ROLE_PROCUREMENT_MANAGER')")
    @Operation(summary = "List all chart of accounts with real-time balances")
    public ResponseEntity<List<AccountDto>> getAllAccounts() {
        return ResponseEntity.ok(ledgerService.getAllAccounts());
    }

    @GetMapping("/trial-balance")
    @PreAuthorize("hasAnyRole('ROLE_CFO_ADMIN', 'ROLE_FINANCE_AUDITOR')")
    @Operation(summary = "Generate real-time Trial Balance verifying double-entry equilibrium")
    public ResponseEntity<TrialBalanceResponse> getTrialBalance(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOfDate) {
        return ResponseEntity.ok(ledgerService.generateTrialBalance(asOfDate));
    }
}
