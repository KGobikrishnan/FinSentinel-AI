package com.finsentinel.telemetry;

import com.finsentinel.procurement.TriageStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnomalyAlertPayload {

    private Long invoiceId;
    private String invoiceNumber;
    private String vendorName;
    private BigDecimal amount;
    private int fraudRiskScore;
    private TriageStatus triageStatus;
    private List<String> anomalyReasons;
    private OffsetDateTime timestamp;
}
