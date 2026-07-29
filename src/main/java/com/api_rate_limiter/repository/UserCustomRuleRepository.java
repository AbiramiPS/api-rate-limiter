package com.api_rate_limiter.repository;

import org.springframework.stereotype.Repository;
import com.api_rate_limiter.entity.UserCustomRule;
import com.api_rate_limiter.entity.UserPlan;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
@Repository
public interface UserCustomRuleRepository extends JpaRepository<UserCustomRule, Long> {
    UserCustomRule findByUser(UserPlan user);

    Page<UserCustomRule> findByUserContainingIgnoreCase(String user, Pageable pageable);
}
