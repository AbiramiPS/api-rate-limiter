package com.api_rate_limiter.dto.response;

import lombok.Data;

@Data
public class RatePlanRuleResponse {

    private Long id;

    private String planName;

    private Integer maxRequests;
    private Integer windowValue;
    private String windowUnit;
}