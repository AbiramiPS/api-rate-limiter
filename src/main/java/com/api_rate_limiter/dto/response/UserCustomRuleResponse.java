package com.api_rate_limiter.dto.response;
 import lombok.Data;
@Data
public class UserCustomRuleResponse {

    private Long id;
    private String clientId;
    private String clientName;
    private Integer maxRequests;
    private Integer windowValue;
    private String windowUnit;
}