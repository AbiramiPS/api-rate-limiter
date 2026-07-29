package com.api_rate_limiter.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.api_rate_limiter.entity.RatePlan;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface RatePlanRepository extends JpaRepository<RatePlan,Long>{
    Optional<RatePlan> findByPlanName(String planName);

    Page<RatePlan> findByPlanNameContainingIgnoreCase(String planName, Pageable pageable);
}
