package com.api_rate_limiter.repository;
import com.api_rate_limiter.entity.RatePlanRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.api_rate_limiter.entity.RatePlan;
@Repository
public interface RuleRepository extends JpaRepository<RatePlanRule, Long> {
    RatePlanRule findByPlan(RatePlan plan);
}