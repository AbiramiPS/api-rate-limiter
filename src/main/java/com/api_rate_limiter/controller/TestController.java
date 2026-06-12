
package com.api_rate_limiter.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Autowired;
import com.api_rate_limiter.service.TestService;

@RestController  // rest api controller
@RequestMapping("/api") // base path for all endpoints in this controller
public class TestController{
    @Autowired
    private TestService testService;

    @GetMapping("/test") // Get request mapping for /api/test endpoint
    public String testEndpoint() {

        boolean allowed = testService.isRequestAllowed("ok"); // Check if the request is allowed based on rate limiting logic
        if (allowed) {
            return "Request is allowed. This is a response from the API.";
        } else {
            return "Request is denied due to rate limiting.";
        }
    }
}