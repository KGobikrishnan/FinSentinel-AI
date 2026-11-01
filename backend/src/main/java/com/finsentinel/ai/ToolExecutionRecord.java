package com.finsentinel.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ToolExecutionRecord {

    private String toolName;
    private String description;
    private Map<String, Object> arguments;
    private Object result;
    private long executionTimeMs;
}
