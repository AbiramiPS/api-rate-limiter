package com.api_rate_limiter.interceptor;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Autowired;
import com.api_rate_limiter.service.RateLimiterService;


@Component
public class RateLimiterInterceptor implements HandlerInterceptor {
    @Autowired
    private RateLimiterService rateLimiterService;  

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String clientId = request.getHeader("X-clientId");
        
        if (clientId == null || clientId.isEmpty()) {
            response.setStatus(HttpStatus.BAD_REQUEST.value());
            response.getWriter().write("Missing X-clientId header.");
            return false; // Deny the request
        }
            if(!rateLimiterService.isRequestAllowed(clientId)) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.getWriter().write("Request is denied due to rate limiting.");
            return false; // Deny the request
        }
        return true; // Allow the request to proceed
    }
}