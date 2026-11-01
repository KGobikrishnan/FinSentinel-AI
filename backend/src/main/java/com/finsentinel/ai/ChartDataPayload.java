package com.finsentinel.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChartDataPayload {

    private String chartType; // "bar", "line", "pie", "area"
    private String title;
    private String xAxisKey;
    private List<String> seriesKeys;
    private List<Map<String, Object>> data;
}
