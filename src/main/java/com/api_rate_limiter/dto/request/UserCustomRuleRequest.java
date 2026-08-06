package com.api_rate_limiter.dto.request;


import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UserCustomRuleRequest {
    @NotNull(message = "User Plan Id is required")
    private Long userPlanId;
    @Positive(message = "Max requests must be greater than 0")
    private Integer maxRequests;
    @Positive(message = "Window value must be greater than 0")
    private Integer windowValue;
    @NotBlank(message = "Window unit is required")
    private String windowUnit;
    @Positive(message = "Price must be greater than 0")
    private BigDecimal price;

    private Boolean active;
}
