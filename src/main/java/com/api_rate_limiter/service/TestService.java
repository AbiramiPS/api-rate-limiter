package com.api_rate_limiter.service;
import org.springframework.stereotype.Service;

@Service
public class TestService {
public boolean isRequestAllowed(String clientId) {
        // Implement your rate limiting logic here.
        // For example, you could check the number of requests made by the client in the last minute and compare it to a predefined limit.
        return true; // Allow all requests for now (for demonstration purposes).
    }

}