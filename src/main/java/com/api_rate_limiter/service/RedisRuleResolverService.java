package com.api_rate_limiter.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.api_rate_limiter.dto.response.RedisRuleCacheResponse;
import com.api_rate_limiter.entity.RatePlanRule;
import com.api_rate_limiter.entity.UserCustomRule;
import com.api_rate_limiter.entity.UserPlan;

@Service
public class RedisRuleResolverService {

    @Autowired
    private UserPlanService userPlanService;

    @Autowired
    private RuleService ruleService;

    @Autowired
    private UserCustomRuleService customRuleService;

    @Autowired
    private RedisService redisService;

    public RedisRuleCacheResponse resolveRedisRule(String clientId) {

        /*
         * 1. Check Redis cache first
         */
        RedisRuleCacheResponse cachedRule = redisService.getCachedRule(clientId);

        if (cachedRule != null) {

            System.out.println(
                    "Redis CACHE HIT: " + clientId);

            return cachedRule;
        }

        /*
         * 2. Cache miss
         */
        System.out.println(
                "Redis CACHE MISS: " + clientId);

        /*
         * 3. Get user from database
         */
        UserPlan user = userPlanService.getUserPlanEntity(clientId);

        RedisRuleCacheResponse resolvedRule;

        /*
         * 4. Enterprise Custom Rule
         */
        if (user.isCustomRuleEnabled()) {

            UserCustomRule customRule = customRuleService.getRuleEntity(user);
            if (customRule.getActive() == null || !customRule.getActive()) {
                throw new com.api_rate_limiter.exception.ResourceNotFoundException(
                        "Custom rate-limit configuration is missing for this client.");
            }

            resolvedRule = new RedisRuleCacheResponse(
                    customRule.getMaxRequests(),
                    customRule.getWindowValue(),
                    customRule.getWindowUnit());
        }

        /*
         * 5. Default Rate Plan Rule
         */
        else {

            RatePlanRule rule = ruleService.getRuleEntity(
                    user.getPlan());

            resolvedRule = new RedisRuleCacheResponse(
                    rule.getMaxRequests(),
                    rule.getWindowValue(),
                    rule.getWindowUnit());
        }

        /*
         * 6. Save resolved rule in Redis
         */
        redisService.saveCachedRule(
                clientId,
                resolvedRule);

        /*
         * 7. Return rule
         */
        return resolvedRule;
    }
}