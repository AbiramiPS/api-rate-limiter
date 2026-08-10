package com.api_rate_limiter.controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;

import com.api_rate_limiter.service.RedisRateLimiterService;
@RestController
@RequestMapping("/admin/test")
public class RedisRateLimitTestController {

    @Autowired
    private RedisRateLimiterService rateLimiterService;

    @GetMapping("/{clientId}")
    public String test(@PathVariable String clientId) {

        boolean allowed = rateLimiterService.isAllowed(clientId);

        if (allowed) {
            return "Allowed";
        }

        return "Too Many Requests";
    }
    
}