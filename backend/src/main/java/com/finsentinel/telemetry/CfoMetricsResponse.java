package com.finsentinel.telemetry;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CfoMetricsResponse {

    private BigDecimal netLiquidity;
    private BigDecimal accountsReceivable;
    private BigDecimal accountsPayable;
    private BigDecimal totalInvoiced;
    private BigDecimal highRiskExposure;
    private long fraudAnomalyCount;
    private BigDecimal monthlyBurnRate;
    private BigDecimal runwayMonths;
    private BigDecimal equityCapital;
    private List<Map<String, Object>> cashflowTrends;
    private List<Map<String, Object>> spendBreakdown;
    private OffsetDateTime lastUpdated;
}
