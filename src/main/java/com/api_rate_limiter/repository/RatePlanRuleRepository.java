package com.api_rate_limiter.repository;
import org.springframework.data.jpa.repository.JpaRepository;

import com.api_rate_limiter.entity.RatePlan;
import com.api_rate_limiter.entity.RatePlanRule;

public interface RatePlanRuleRepository extends JpaRepository<RatePlanRule,Long>{
    RatePlanRule findByPlan(RatePlan plan);
}