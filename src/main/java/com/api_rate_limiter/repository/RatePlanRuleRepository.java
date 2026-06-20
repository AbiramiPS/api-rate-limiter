package com.api_rate_limiter.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.api_rate_limiter.entity.RatePlan;
import com.api_rate_limiter.entity.RatePlanRule;


    @Repository
public interface RatePlanRuleRepository
extends JpaRepository<
RatePlanRule,
Long>{

RatePlanRule
findByPlan(
RatePlan plan
);

}
