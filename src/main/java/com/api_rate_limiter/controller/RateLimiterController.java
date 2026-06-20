package com.api_rate_limiter.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class RateLimiterController {
    

    // http://localhost:8082/api/rate-limit
    @GetMapping("/rate-limit") 
    public String rateLimitEndpoint() {

        return "Request is allowed. This is a response from the API.";
    }
}
