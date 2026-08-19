package com.api_rate_limiter.dto.request;


import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UserCustomRuleRequest {
    private Long userPlanId;
    @Positive(message = "Max requests must be greater than 0")
    private Integer maxRequests;
    @Positive(message = "Window value must be greater than 0")
    private Integer windowValue;
    @NotBlank(message = "Window unit is required")
    private String windowUnit;
    @Min(value = 0, message = "Price must be greater than or equal to 0")
    private BigDecimal price;

    private Boolean active;
}
