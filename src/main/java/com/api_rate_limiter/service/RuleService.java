package com.api_rate_limiter.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

import com.api_rate_limiter.entity.RatePlan;
import com.api_rate_limiter.entity.RatePlanRule;

import com.api_rate_limiter.repository.RuleRepository;
import com.api_rate_limiter.repository.RatePlanRepository;

@Service
public class RuleService {
        @Autowired
        private RuleRepository ruleRepository;
        @Autowired
        private RatePlanRepository ratePlanRepository;

        /*         * GET         */
        public RatePlanRule getRuleByPlan(String planName) {
                RatePlan plan = ratePlanRepository.findByPlanName(planName);
                return ruleRepository.findByPlan(plan);
        }

        /*         * ADD THIS         */
        public RatePlanRule saveRule(RatePlanRule rule) {
                RatePlanRule existing = ruleRepository.findByPlan(rule.getPlan());
                if (existing != null) {
                        rule.setId(existing.getId());
                }
                return ruleRepository.save(rule);
        }
}