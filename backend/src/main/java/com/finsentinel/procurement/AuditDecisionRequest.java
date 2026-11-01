package com.finsentinel.procurement;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditDecisionRequest {

    @NotNull(message = "Decision (APPROVED or REJECTED) is required")
    private Decision decision; // APPROVED, REJECTED

    @NotBlank(message = "Audit rationale memo is required")
    private String rationale;

    public enum Decision {
        APPROVED,
        REJECTED
    }
}
