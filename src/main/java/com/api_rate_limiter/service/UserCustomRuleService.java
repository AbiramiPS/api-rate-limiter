package com.api_rate_limiter.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import com.api_rate_limiter.entity.UserCustomRule;
import com.api_rate_limiter.entity.UserPlan;
import com.api_rate_limiter.repository.UserCustomRuleRepository;
import com.api_rate_limiter.repository.UserPlanRepository;

@Service
public class UserCustomRuleService {

@Autowired
private UserCustomRuleRepository repo;

@Autowired
private UserPlanRepository userRepo;

/*GET*/
public UserCustomRule getRule(UserPlan user){
    return repo.findByUser(user);
}

/* SAVE */
public UserCustomRule saveRule(UserCustomRule rule) {
    Long userId = rule.getUser().getId();
    UserPlan user = userRepo.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
    rule.setUser(user);
    return repo.save(rule);
}

}