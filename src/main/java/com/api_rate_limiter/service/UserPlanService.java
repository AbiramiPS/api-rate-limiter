package com.api_rate_limiter.service;

import org.springframework.stereotype.Service;
import java.lang.module.ResolutionException;
import org.springframework.beans.factory.annotation.Autowired;
import com.api_rate_limiter.entity.UserPlan;
import com.api_rate_limiter.dto.request.UserPlanRequest;
import com.api_rate_limiter.dto.response.UserPlanResponse;
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

    public UserPlanResponse saveUserPlan(UserPlanRequest request) {
        // Check if clientId already exists
        if (repo.findByClientId(request.getClientId()) != null) {
            throw new DuplicateResourceException("Client ID already exists");
        }
        Long planId = request.getPlanId(); // to get the plan id
        RatePlan plan = planRepo.findById(planId).orElseThrow(() -> 
            new ResourceNotFoundException("Plan not found"));
        
        UserPlan user = new UserPlan();

        user.setClientId(request.getClientId());
        user.setClientName(request .getClientName());
        user.setCustomRuleEnabled(request.getCustomRuleEnabled());
        user.setPlan(plan); 
        UserPlan saved = repo.save(user);

        // Entity -> Response DTO
        UserPlanResponse response = new UserPlanResponse();

        response.setId(saved.getId());
        response.setClientId(saved.getClientId());
        response.setClientName(saved.getClientName());
        response.setPlanName(saved.getPlan().getPlanName());
        response.setCustomRuleEnabled(saved.isCustomRuleEnabled());

        return response;
    }

    public UserPlanResponse getUserPlan(String clientId) {
        UserPlan user = repo.findByClientId(clientId);

        if (user == null) {
            throw new ResourceNotFoundException("User not found");
        }

        UserPlanResponse response = new UserPlanResponse();

        response.setId(user.getId());
        response.setClientId(user.getClientId());
        response.setClientName(user.getClientName());
        response.setPlanName(user.getPlan().getPlanName());
        response.setCustomRuleEnabled(user.isCustomRuleEnabled());

        return response;
    }

    public UserPlan getUserPlanEntity(String clientId) {
        UserPlan user = repo.findByClientId(clientId);
        if (user == null) {
            throw new ResourceNotFoundException("User not found");
        }
        return user;
    }
    public List<UserPlanResponse> getAll() {
        List<UserPlan> users = repo.findAll();

        return users.stream().map(user -> {

            UserPlanResponse response = new UserPlanResponse();

            response.setId(user.getId());
            response.setClientId(user.getClientId());
            response.setClientName(user.getClientName());
            response.setPlanName(user.getPlan().getPlanName());
            response.setCustomRuleEnabled(user.isCustomRuleEnabled());

            return response;

        }).toList();
    }
}