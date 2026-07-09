package com.api_rate_limiter.repository;

import com.api_rate_limiter.entity.UserPlan;
import org.springframework.data.jpa.repository.JpaRepository;
public interface UserPlanRepository extends JpaRepository<UserPlan, Long> {
    UserPlan findByClientId(String clientId);
}