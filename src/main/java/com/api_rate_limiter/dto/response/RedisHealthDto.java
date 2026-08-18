package com.api_rate_limiter.dto.response;

import lombok.Data;

@Data
public class RedisHealthDto {
    private boolean connected;
    private String redisVersion;
    private long memoryUsed;
    private int totalKeys;
}
