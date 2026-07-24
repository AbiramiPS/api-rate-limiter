package com.api_rate_limiter.dto.response;

import lombok.Data;

@Data
public class UserPlanResponse {

    private Long id;

    private String clientId;

    private String clientName;

    private String planName;

    private boolean customRuleEnabled;
}