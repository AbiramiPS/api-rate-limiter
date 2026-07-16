package com.api_rate_limiter.service;

import org.springframework.stereotype.Service;
import java.lang.module.ResolutionException;
import org.springframework.beans.factory.annotation.Autowired;
import com.api_rate_limiter.entity.UserPlan;
import com.api_rate_limiter.entity.RatePlan;
import com.api_rate_limiter.repository.UserPlanRepository;
import com.api_rate_limiter.repository.RatePlanRepository;
import com.api_rate_limiter.exception.DuplicateResourceException;
import com.api_rate_limiter.exception.ResourceNotFoundException;
import java.util.List;
@Service
public class UserPlanService {

    @Autowired
    private UserPlanRepository repo;

    @Autowired
    private RatePlanRepository planRepo;

    public UserPlan saveUserPlan(UserPlan user) {
        // Check if clientId already exists
        if (repo.findByClientId(user.getClientId()) != null) {
            throw new DuplicateResourceException("Client ID already exists");
        }
        Long planId = user.getPlan().getId(); // to get the plan id
        RatePlan plan = planRepo.findById(planId).orElseThrow(() -> new ResourceNotFoundException(
                "Plan not found"));
        user.setPlan(plan);
        return repo.save(user);
    }

    public UserPlan getUserPlan(String clientId) {
        return repo.findByClientId(clientId);
    }
    
    public List<UserPlan> getAll() {
        return repo.findAll();
    }
}