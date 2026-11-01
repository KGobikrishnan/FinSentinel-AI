package com.finsentinel.telemetry;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TelemetryBroadcaster {

    private static final Logger log = LoggerFactory.getLogger(TelemetryBroadcaster.class);

    private final SimpMessagingTemplate messagingTemplate;

    public void broadcastAnomaly(AnomalyAlertPayload payload) {
        log.warn("Broadcasting fraud anomaly alert over STOMP: Invoice {} Risk Score {}",
                payload.getInvoiceNumber(), payload.getFraudRiskScore());
        messagingTemplate.convertAndSend("/topic/anomaly-alerts", payload);
    }

    public void broadcastMetrics(Object metricsPayload) {
        log.debug("Broadcasting CFO dashboard telemetry update over STOMP");
        messagingTemplate.convertAndSend("/topic/dashboard-metrics", metricsPayload);
    }
}
