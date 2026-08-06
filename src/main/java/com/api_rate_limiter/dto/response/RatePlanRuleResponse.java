package com.api_rate_limiter.dto.response;

import lombok.Data;
import lombok.Setter;
import lombok.Getter;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
@Data
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class RatePlanRuleResponse {

    private Long id;

    private String planName;

    private Integer maxRequests;
    private Integer windowValue;
    private String windowUnit;
}