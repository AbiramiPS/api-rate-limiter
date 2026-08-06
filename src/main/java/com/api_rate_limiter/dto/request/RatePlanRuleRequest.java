package com.api_rate_limiter.dto.request;

import lombok.Data;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

@Data
public class RatePlanRuleRequest {

    @NotNull(message = "Plan Id is required")
    private Long planId;

    @Positive(message = "Max requests must be greater than 0")
    private Integer maxRequests;

    @Positive(message = "Window value must be greater than 0")
    private Integer windowValue;

    @NotBlank(message = "Window unit is required")
    private String windowUnit;
}