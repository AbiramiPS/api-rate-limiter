package com.api_rate_limiter.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RedisRuleCacheResponse {
    private Integer maxRequests;
    private Integer windowValue;
    private String windowUnit;
}