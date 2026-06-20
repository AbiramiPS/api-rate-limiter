package com.api_rate_limiter.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.beans.factory.annotation.Autowired;
import com.api_rate_limiter.interceptor.RateLimiterInterceptor;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Autowired
    private RateLimiterInterceptor rateLimiterInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(rateLimiterInterceptor)
        .excludePathPatterns("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html",
            "/admin/**", "/error"
        ); // Exclude Swagger UI and API docs from rate limiting
    }
}