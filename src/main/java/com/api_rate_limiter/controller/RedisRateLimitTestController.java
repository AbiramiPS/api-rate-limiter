package com.api_rate_limiter.controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;

import com.api_rate_limiter.dto.response.RedisRateLimitResultResponse;
import com.api_rate_limiter.service.RedisRateLimiterService;
@RestController
@RequestMapping("/admin/test")
public class RedisRateLimitTestController {

    @Autowired
    private RedisRateLimiterService rateLimiterService;

    @GetMapping("/{clientId}")
    public String test(@PathVariable String clientId) {
    RedisRateLimitResultResponse result =
            rateLimiterService.checkRateLimit(clientId);

    if (result.isAllowed()) {
        return "Allowed | Limit: "
                + result.getLimit()
                + " | Remaining: "
                + result.getRemaining()
                + " | Reset: "
                + result.getResetTime()
                + " seconds";
    }

    return "Too Many Requests | Retry after: "
            + result.getResetTime()
            + " seconds";
        
    }
    
}