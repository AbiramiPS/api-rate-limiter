package com.api_rate_limiter.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

import com.api_rate_limiter.dto.request.RatePlanRuleRequest;
import com.api_rate_limiter.dto.response.RatePlanRuleResponse;
import com.api_rate_limiter.entity.RatePlan;
import com.api_rate_limiter.entity.RatePlanRule;

import com.api_rate_limiter.repository.RatePlanRuleRepository;
import com.api_rate_limiter.repository.RatePlanRepository;
import com.api_rate_limiter.exception.ResourceNotFoundException;
import com.api_rate_limiter.mapper.RatePlanRuleMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
public class RuleService {
        @Autowired
        private RatePlanRuleRepository repo;
        @Autowired
        private RatePlanRepository planRepo;
        @Autowired
        private RatePlanRuleMapper mapper;

        /* * GET */
        public RatePlanRuleResponse getRule(Long planId) {
                RatePlan plan = planRepo.findById(planId)
                                .orElseThrow(() -> new ResourceNotFoundException("Plan not found"));
                RatePlanRule rule = repo.findByPlan(plan);
                if (rule == null) {
                        throw new ResourceNotFoundException("Rule not found");
                }
                return mapper.toResponse(rule);
        }

        public RatePlanRuleResponse saveRule(RatePlanRuleRequest request) {

                RatePlan plan = planRepo.findById(request.getPlanId())
                                .orElseThrow(() -> new ResourceNotFoundException("Plan not found"));

                RatePlanRule rule = mapper.toEntity(request);
                rule.setPlan(plan);
                RatePlanRule saved = repo.save(rule);
                return mapper.toResponse(saved);
        }

        public Page<RatePlanRuleResponse> getAll(Pageable pageable) {
                Page<RatePlanRule> rules = repo.findAll(pageable);
                return rules.map(mapper::toResponse);

        }

        public Page<RatePlanRuleResponse> searchRules(String planName, Pageable pageable) {
                return repo.findByPlan_PlanNameContainingIgnoreCase(planName, pageable)
                                .map(mapper::toResponse);

        }
        
        public RatePlanRule getRuleEntity(RatePlan plan) {
                RatePlanRule rule = repo.findByPlan(plan);
                if (rule == null) {
                        throw new ResourceNotFoundException("Rate Plan Rule not found");
                }
                return rule;
        }
}