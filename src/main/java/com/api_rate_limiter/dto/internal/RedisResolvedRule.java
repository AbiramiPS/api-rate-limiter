package com.api_rate_limiter.dto.internal;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RedisResolvedRule {

    private Integer maxRequests;
    private Integer windowValue;
    private String windowUnit;
}