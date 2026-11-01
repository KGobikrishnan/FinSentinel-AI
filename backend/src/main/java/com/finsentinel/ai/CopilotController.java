package com.finsentinel.ai;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/copilot")
@RequiredArgsConstructor
@Tag(name = "Ask FinSentinel — Agentic FinOps Copilot", description = "Autonomous natural language financial queries with tool calling and RAG policy retrieval")
public class CopilotController {

    private final CopilotService copilotService;

    @PostMapping("/ask")
    @PreAuthorize("hasAnyRole('ROLE_CFO_ADMIN', 'ROLE_FINANCE_AUDITOR', 'ROLE_PROCUREMENT_MANAGER')")
    @Operation(summary = "Ask FinOps Copilot a financial or compliance question with dynamic tool execution and charts")
    public ResponseEntity<CopilotResponse> askCopilot(@Valid @RequestBody CopilotRequest request) {
        return ResponseEntity.ok(copilotService.answerQuestion(request));
    }
}
