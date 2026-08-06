package com.api_rate_limiter.repository;
import org.springframework.data.domain.Pageable;
import com.api_rate_limiter.entity.UserPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
public interface UserPlanRepository extends JpaRepository<UserPlan, Long> {

    UserPlan findByClientId(String clientId);
        Page<UserPlan> findByClientNameContainingIgnoreCase(
            String clientName,
            Pageable pageable);
}