package com.api_rate_limiter.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.api_rate_limiter.entity.RatePlan;


@Repository
public interface RatePlanRepository
extends JpaRepository<
RatePlan,
Long>{


RatePlan
findByPlanName(
String plan
);

}
