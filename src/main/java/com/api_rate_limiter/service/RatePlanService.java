package com.api_rate_limiter.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.api_rate_limiter.dto.request.RatePlanRequest;
import com.api_rate_limiter.dto.response.RatePlanResponse;
import com.api_rate_limiter.entity.RatePlan;
import com.api_rate_limiter.mapper.RatePlanMapper;
import com.api_rate_limiter.repository.RatePlanRepository;
import com.api_rate_limiter.repository.RatePlanRuleRepository;
import com.api_rate_limiter.entity.RatePlanRule;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
@Service
public class RatePlanService {

        @Autowired
        private RatePlanRepository repository;

        @Autowired
        private RatePlanRuleRepository ruleRepository;

        @Autowired
        private RatePlanMapper mapper;

        public RatePlanResponse savePlan(RatePlanRequest request) {
                RatePlan plan = mapper.toEntity(request);
                RatePlan saved = repository.save(plan);
                return mapper.toResponse(saved);
        }

        public RatePlanResponse getPlan(String planName) {
                RatePlan plan = repository.findByPlanName(planName).orElseThrow(() -> new RuntimeException("Plan not found"));
                RatePlanResponse response = mapper.toResponse(plan);
                // Populate rule information if exists
                RatePlanRule rule = ruleRepository.findByPlan(plan);
                if (rule != null) {
                    response.setMaxRequests(rule.getMaxRequests());
                    response.setWindowValue(rule.getWindowValue());
                    response.setWindowUnit(rule.getWindowUnit());
                }
                return response;
        }

        public Page<RatePlanResponse> getAll(Pageable pageable) {
                Page<RatePlan> plans = repository.findAll(pageable);
                return plans.map(mapper::toResponse);
        }

        public Page<RatePlanResponse> searchPlans(String planName, Pageable pageable) {
                Page<RatePlan> plans = repository.findByPlanNameContainingIgnoreCase(planName, pageable);
                return plans.map(mapper::toResponse);
        }
}