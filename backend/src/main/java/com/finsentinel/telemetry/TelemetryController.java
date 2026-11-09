package com.finsentinel.telemetry;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/telemetry")
@RequiredArgsConstructor
@Tag(name = "Telemetry & CFO Real-Time Dashboard", description = "Aggregated financial KPIs, cashflow runway, burn rate, and live metrics")
public class TelemetryController {

    private final CfoDashboardService cfoDashboardService;

    @GetMapping("/cfo-metrics")
    @PreAuthorize("hasAnyRole('CFO_ADMIN', 'FINANCE_AUDITOR', 'PROCUREMENT_MANAGER')")
    @Operation(summary = "Retrieve real-time aggregated CFO financial metrics and runway")
    public ResponseEntity<CfoMetricsResponse> getCfoMetrics() {
        return ResponseEntity.ok(cfoDashboardService.calculateMetrics());
    }
}
