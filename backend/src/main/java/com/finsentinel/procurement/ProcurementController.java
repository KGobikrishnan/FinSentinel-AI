package com.finsentinel.procurement;

import com.finsentinel.auth.User;
import com.finsentinel.common.AuditedAction;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/procurement")
@RequiredArgsConstructor
@Tag(name = "AI Smart Procurement & Fraud Triage", description = "PDF invoice parsing, AI fraud scoring, GST validation, and automated journal postings")
public class ProcurementController {

    private final ProcurementService procurementService;

    @PostMapping(value = "/invoices/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @AuditedAction(action = "UPLOAD_PDF_INVOICE", entity = "INVOICE")
    @PreAuthorize("hasAnyRole('CFO_ADMIN', 'FINANCE_AUDITOR', 'PROCUREMENT_MANAGER', 'VENDOR')")
    @Operation(summary = "Upload PDF invoice for automated PDFBox parsing and AI fraud triage")
    public ResponseEntity<InvoiceResponse> uploadInvoice(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User user) throws IOException {
        String createdBy = user != null ? user.getUsername() : "ANONYMOUS_VENDOR";
        InvoiceResponse response = procurementService.processPdfUpload(file, createdBy);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/invoices")
    @AuditedAction(action = "CREATE_JSON_INVOICE", entity = "INVOICE")
    @PreAuthorize("hasAnyRole('CFO_ADMIN', 'FINANCE_AUDITOR', 'PROCUREMENT_MANAGER', 'VENDOR')")
    @Operation(summary = "Submit structured JSON invoice with line items for instant AI fraud scoring")
    public ResponseEntity<InvoiceResponse> createInvoice(
            @Valid @RequestBody InvoiceCreateRequest request,
            @AuthenticationPrincipal User user) {
        String createdBy = user != null ? user.getUsername() : "ANONYMOUS_VENDOR";
        InvoiceResponse response = procurementService.processJsonInvoice(request, createdBy);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/invoices")
    @PreAuthorize("hasAnyRole('CFO_ADMIN', 'FINANCE_AUDITOR', 'PROCUREMENT_MANAGER')")
    @Operation(summary = "List all invoices and their triage status")
    public ResponseEntity<List<InvoiceResponse>> getAllInvoices() {
        return ResponseEntity.ok(procurementService.getAllInvoices());
    }

    @GetMapping("/invoices/{id}")
    @PreAuthorize("hasAnyRole('CFO_ADMIN', 'FINANCE_AUDITOR', 'PROCUREMENT_MANAGER', 'VENDOR')")
    @Operation(summary = "Get invoice detail and fraud triage report")
    public ResponseEntity<InvoiceResponse> getInvoiceById(@PathVariable Long id) {
        return ResponseEntity.ok(procurementService.getInvoiceById(id));
    }

    @PostMapping("/invoices/{id}/audit-decision")
    @AuditedAction(action = "APPLY_AUDIT_DECISION", entity = "INVOICE")
    @PreAuthorize("hasAnyRole('CFO_ADMIN', 'FINANCE_AUDITOR')")
    @Operation(summary = "Manual Auditor/CFO override decision for flagged invoices")
    public ResponseEntity<InvoiceResponse> applyAuditDecision(
            @PathVariable Long id,
            @Valid @RequestBody AuditDecisionRequest decisionRequest,
            @AuthenticationPrincipal User user) {
        String auditorName = user != null ? user.getUsername() : "CFO_AUDITOR";
        InvoiceResponse response = procurementService.applyAuditDecision(id, decisionRequest, auditorName);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/vendors")
    @PreAuthorize("hasAnyRole('CFO_ADMIN', 'FINANCE_AUDITOR', 'PROCUREMENT_MANAGER')")
    @Operation(summary = "List all enterprise vendors and risk tiers")
    public ResponseEntity<List<VendorDto>> getAllVendors() {
        return ResponseEntity.ok(procurementService.getAllVendors());
    }
}
