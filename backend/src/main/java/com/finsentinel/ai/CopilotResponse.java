package com.finsentinel.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CopilotResponse {

    private String markdownResponse;
    private List<ToolExecutionRecord> executedTools;
    private ChartDataPayload chartData;
    private List<String> ragCitations;
    private OffsetDateTime timestamp;
}
