package com.api_rate_limiter.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.api_rate_limiter.service.RedisService;
@Service
public class RedisRateLimiterService {
    @Autowired
    private RedisService redisService;

    @Autowired
    private UserPlanService userPlanService;

    @Autowired
    private RuleService ruleService;

}
