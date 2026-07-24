        package com.api_rate_limiter.service;

        import org.springframework.stereotype.Service;
        import org.springframework.beans.factory.annotation.Autowired;

        import com.api_rate_limiter.dto.request.RatePlanRuleRequest;
        import com.api_rate_limiter.dto.response.RatePlanRuleResponse;
        import com.api_rate_limiter.entity.RatePlan;
        import com.api_rate_limiter.entity.RatePlanRule;

        import com.api_rate_limiter.repository.RuleRepository;
        import com.api_rate_limiter.repository.RatePlanRepository;
        import com.api_rate_limiter.exception.ResourceNotFoundException;
        import com.api_rate_limiter.mapper.RatePlanRuleMapper;

        @Service
        public class RuleService {
                @Autowired
                private RuleRepository repo;
                @Autowired
                private RatePlanRepository planRepo;
                @Autowired
                private RatePlanRuleMapper mapper;

                /*         * GET         */
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
                .orElseThrow(() ->
                        new ResourceNotFoundException("Plan not found"));

        RatePlanRule rule = mapper.toEntity(request);
        rule.setPlan(plan);
        RatePlanRule saved = repo.save(rule);
        return mapper.toResponse(saved);
        }
        }