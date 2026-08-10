package com.api_rate_limiter.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.api_rate_limiter.dto.internal.RedisResolvedRule;
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

    public RedisResolvedRule resolveRedisRule(String clientId) {

        UserPlan user = userPlanService.getUserPlanEntity(clientId);

        // Enterprise Custom Rule
        if (user.isCustomRuleEnabled()) {

            UserCustomRule customRule = customRuleService.getRuleEntity(user);

            return new RedisResolvedRule(
                    customRule.getMaxRequests(),
                    customRule.getWindowValue(),
                    customRule.getWindowUnit());
        }

        // Default Rule
        RatePlanRule rule = ruleService.getRuleEntity(user.getPlan());

        return new RedisResolvedRule(
                rule.getMaxRequests(),
                rule.getWindowValue(),
                rule.getWindowUnit());
    }

}