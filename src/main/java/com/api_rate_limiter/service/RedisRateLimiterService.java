package com.api_rate_limiter.service;

import java.time.temporal.ChronoUnit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.api_rate_limiter.dto.internal.RedisResolvedRule;
import com.api_rate_limiter.dto.response.RedisRateLimitResultResponse;
import com.api_rate_limiter.dto.response.RedisRuleCacheResponse;
@Service
public class RedisRateLimiterService {

    @Autowired
    private RedisService redisService;

    @Autowired
    private RedisRuleResolverService redisRuleResolverService;

    @Autowired
    private UserPlanService userPlanService;

    public RedisRateLimitResultResponse checkRateLimit(String clientId) {

        // Get the rule applicable to this client
        RedisRuleCacheResponse rule = redisRuleResolverService.resolveRedisRule(clientId);

        int maxRequests = rule.getMaxRequests();

        long windowSeconds = convertToSeconds(
                rule.getWindowValue(),
                rule.getWindowUnit());

        // Increment Redis counter
        int currentCount = redisService.incrementRequest(
                clientId,
                windowSeconds);

        // Remaining requests
        int remaining = Math.max(0, maxRequests - currentCount);

        // Remaining TTL
        long resetTime = redisService.getRemainingTime(clientId);

        // Check whether request is allowed
        boolean allowed = currentCount <= maxRequests;

        // Log rate-limiting event to Redis
        String clientName = clientId;
        try {
            com.api_rate_limiter.entity.UserPlan user = userPlanService.getUserPlanEntity(clientId);
            if (user != null && user.getClientName() != null) {
                clientName = user.getClientName();
            }
        } catch (Exception e) {
            // Ignore if user not found
        }

        com.api_rate_limiter.dto.response.RedisRateLimitEventDto event = new com.api_rate_limiter.dto.response.RedisRateLimitEventDto(
            clientId,
            clientName,
            allowed ? 200 : 429,
            allowed,
            currentCount,
            maxRequests,
            rule.getWindowValue(),
            rule.getWindowUnit(),
            allowed ? "Request allowed" : "Rate limit exceeded",
            java.time.Instant.now().toString()
        );
        redisService.logEvent(event);

        return new RedisRateLimitResultResponse(
                allowed,
                maxRequests,
                remaining,
                resetTime);
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