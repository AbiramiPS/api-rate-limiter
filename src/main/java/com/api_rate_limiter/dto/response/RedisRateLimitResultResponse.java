package com.api_rate_limiter.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class RedisRateLimitResultResponse {
        private boolean allowed;
        private int limit;
        private int remaining;
        private long resetTime;
}
