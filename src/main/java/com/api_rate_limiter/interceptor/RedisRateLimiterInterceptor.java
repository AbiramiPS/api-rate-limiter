package com.api_rate_limiter.interceptor;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import com.api_rate_limiter.dto.response.RedisRateLimitResultResponse;
import com.api_rate_limiter.service.RedisRateLimiterService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class RedisRateLimiterInterceptor implements HandlerInterceptor {

    @Autowired
    private RedisRateLimiterService rateLimiterService;

    @Override
    public boolean preHandle(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler) throws IOException {

        String clientId = request.getHeader("X-clientId");

        // Client ID is mandatory
        if (clientId == null || clientId.isBlank()) {

            response.setStatus(
                    HttpServletResponse.SC_BAD_REQUEST);

            return false;
        }

        RedisRateLimitResultResponse result;

        try {

            result = rateLimiterService.checkRateLimit(clientId);

        } catch (Exception e) {

            // Redis / rate limiter failure
            response.setStatus(
                    HttpServletResponse.SC_SERVICE_UNAVAILABLE);

            response.setContentType("application/json");

            response.getWriter().write(
                    "{\"message\":\"Rate limiting service is temporarily unavailable\"}");

            return false;
        }

        // Add rate-limit headers
        response.setHeader(
                "X-RateLimit-Limit",
                String.valueOf(result.getLimit()));

        response.setHeader(
                "X-RateLimit-Remaining",
                String.valueOf(result.getRemaining()));

        response.setHeader(
                "X-RateLimit-Reset",
                String.valueOf(result.getResetTime()));

        // Rate limit exceeded
        if (!result.isAllowed()) {

            response.setStatus(429);

            response.setContentType("application/json");

            response.getWriter().write(
                    "{"
                            + "\"status\":429,"
                            + "\"message\":\"Rate limit exceeded\","
                            + "\"retryAfter\":"
                            + result.getResetTime()
                            + "}");

            return false;
        }

        // Request allowed
        return true;
    }
}