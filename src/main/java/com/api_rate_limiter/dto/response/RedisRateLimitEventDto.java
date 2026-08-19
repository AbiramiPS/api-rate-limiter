package com.api_rate_limiter.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RedisRateLimitEventDto {
    private String clientId;
    private String clientName;
    private Integer statusCode;
    private boolean allowed;
    private Integer currentCount;
    private Integer maxRequests;
    private Integer windowValue;
    private String windowUnit;
    private String message;
    private String timestamp;
}
