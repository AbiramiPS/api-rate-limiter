package com.api_rate_limiter.interceptor;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import com.api_rate_limiter.service.RedisRateLimiterService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
@Component
public class RedisRateLimiterInterceptor implements HandlerInterceptor {

    @Autowired
    private RedisRateLimiterService rateLimiterService;

    @Override
    public boolean preHandle(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler) throws IOException{

        // Get client ID from request header
        String clientId = request.getHeader("X-clientId");

        // Client ID is mandatory
        if (clientId == null || clientId.isBlank()) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return false;
        }

        // Ask Redis rate limiter whether request is allowed
        boolean allowed = rateLimiterService.isAllowed(clientId);

        // Rate limit exceeded
        if (!allowed) {
            response.setStatus(429);
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"message\":\"Rate limit exceeded. Please try again later.\"}");

            return false;
        }

        // Request is allowed
        return true;
    }
}