package com.api_rate_limiter.service;

import java.time.temporal.ChronoUnit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.api_rate_limiter.dto.internal.RedisResolvedRule;

@Service
public class RedisRateLimiterService {

    @Autowired
    private RedisService redisService;

    @Autowired
    private RedisRuleResolverService redisRuleResolverService;

    public boolean isAllowed(String clientId) {

        RedisResolvedRule rule = redisRuleResolverService.resolveRedisRule(clientId);

        long windowSeconds = convertToSeconds(
                rule.getWindowValue(),
                rule.getWindowUnit());

        int count = redisService.incrementRequest(
                clientId,
                windowSeconds);

        return count <= rule.getMaxRequests();
    }

    private long convertToSeconds(
            int value,
            String unit) {

        switch (unit.toUpperCase()) {

            case "SECOND":
            case "SECONDS":
                return value;

            case "MINUTE":
            case "MINUTES":
                return value * ChronoUnit.MINUTES.getDuration().getSeconds();

            case "HOUR":
            case "HOURS":
                return value * ChronoUnit.HOURS.getDuration().getSeconds();

            case "DAY":
            case "DAYS":
                return value * ChronoUnit.DAYS.getDuration().getSeconds();

            default:
                throw new IllegalArgumentException("Invalid Window Unit");
        }
    }
    
}