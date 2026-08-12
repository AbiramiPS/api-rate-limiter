package com.api_rate_limiter.dto.response;

import lombok.Data;
import lombok.NoArgsConstructor;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Data
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor

@Schema(description = "Details about the user object")
public class UserPlanResponse {

    private Long id;
    @Schema(description = "Client ID", example = "C-001")
    private String clientId;
    @Schema(description = "Client name", example = "John Doe")
    private String clientName;
    @Schema(description = "Assigned rate plan", example = "ENTERPRISE")
    private String planName;
    @Schema(description = "Whether the custom rate-limit rule is enabled", example = "true")
    private boolean customRuleEnabled;
}