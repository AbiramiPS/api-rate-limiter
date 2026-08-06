package com.api_rate_limiter.repository;
import org.springframework.data.jpa.repository.JpaRepository;

import com.api_rate_limiter.entity.RatePlan;
import com.api_rate_limiter.entity.RatePlanRule;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
public interface RatePlanRuleRepository extends JpaRepository<RatePlanRule,Long>{
    RatePlanRule findByPlan(RatePlan plan);

    Page<RatePlanRule> findByPlan_PlanNameContainingIgnoreCase(String planName, Pageable pageable);

}