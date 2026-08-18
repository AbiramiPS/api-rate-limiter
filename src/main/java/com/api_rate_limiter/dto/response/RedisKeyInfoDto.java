package com.api_rate_limiter.dto.response;

import lombok.Data;

@Data
public class RedisKeyInfoDto {
    private String key;
    private String category; // COUNTER or RULE
    private String value;
    private Long ttl;
    private String clientId;
}
