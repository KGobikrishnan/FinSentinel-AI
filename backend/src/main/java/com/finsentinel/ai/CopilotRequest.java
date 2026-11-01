package com.finsentinel.ai;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CopilotRequest {

    @NotBlank(message = "Prompt query is required")
    private String query;

    private String conversationId;
    private List<String> contextFilters;
}
