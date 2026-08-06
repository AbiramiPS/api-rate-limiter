package com.api_rate_limiter.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import lombok.Data;

@Data
public class UserPlanRequest {

    @NotBlank(message = "Client ID is required")
    private String clientId;

    @NotBlank(message = "Client name is required")
    private String clientName;

    @NotNull(message = "Plan ID is required")
    private Long planId;

    @NotNull(message = "Custom Rule status is required")
    private Boolean customRuleEnabled;
}