package com.api_rate_limiter.service;

import org.springframework.stereotype.Service;
import java.lang.module.ResolutionException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;

import com.api_rate_limiter.entity.UserPlan;
import com.api_rate_limiter.dto.request.UserPlanRequest;
import com.api_rate_limiter.dto.response.UserPlanResponse;
import com.api_rate_limiter.entity.RatePlan;
import com.api_rate_limiter.repository.UserPlanRepository;
import com.api_rate_limiter.repository.RatePlanRepository;
import com.api_rate_limiter.exception.DuplicateResourceException;
import com.api_rate_limiter.exception.ResourceNotFoundException;
import java.util.List;
import org.springframework.data.domain.Page;
import com.api_rate_limiter.dto.request.UserPlanRequest;

@Service
public class UserPlanService {

    @Autowired
    private UserPlanRepository repo;

    @Autowired
    private RatePlanRepository planRepo;

    private UserPlanResponse toResponse(UserPlan user) {

        UserPlanResponse response = new UserPlanResponse();

        response.setId(user.getId());
        response.setClientId(user.getClientId());
        response.setClientName(user.getClientName());
        response.setPlanName(user.getPlan().getPlanName());
        response.setCustomRuleEnabled(user.isCustomRuleEnabled());

        return response;
    }

    public UserPlanResponse saveUserPlan(UserPlanRequest request) {
        // Check if clientId already exists
        if (repo.findByClientId(request.getClientId()) != null) {
            throw new DuplicateResourceException("Client ID already exists");
        }
        Long planId = request.getPlanId(); // to get the plan id
        RatePlan plan = planRepo.findById(planId).orElseThrow(() -> new ResourceNotFoundException("Plan not found"));

        UserPlan user = new UserPlan();

        user.setClientId(request.getClientId());
        user.setClientName(request.getClientName());
        user.setCustomRuleEnabled(request.getCustomRuleEnabled());
        user.setPlan(plan);
        UserPlan saved = repo.save(user);
        return toResponse(saved);

        // // Entity -> Response DTO
        // UserPlanResponse response = new UserPlanResponse();

        // response.setId(saved.getId());
        // response.setClientId(saved.getClientId());
        // response.setClientName(saved.getClientName());
        // response.setPlanName(saved.getPlan().getPlanName());
        // response.setCustomRuleEnabled(saved.isCustomRuleEnabled());

        // return response;
    }

    public UserPlanResponse getUserPlan(String clientId) {
        UserPlan user = repo.findByClientId(clientId);

        if (user == null) {
            throw new ResourceNotFoundException("User not found");
        }

        // UserPlanResponse response = new UserPlanResponse();

        // response.setId(user.getId());
        // response.setClientId(user.getClientId());
        // response.setClientName(user.getClientName());
        // response.setPlanName(user.getPlan().getPlanName());
        // response.setCustomRuleEnabled(user.isCustomRuleEnabled());
        // return response;
        return toResponse(user);
    }

    public UserPlan getUserPlanEntity(String clientId) {
        UserPlan user = repo.findByClientId(clientId);
        if (user == null) {
            throw new ResourceNotFoundException("User not found");
        }
        return user;
    }

    public Page<UserPlanResponse> getAll(Pageable pageable) {
        Page<UserPlan> users = repo.findAll(pageable);
        return users.map(this::toResponse);
        // return users.map(user -> {
        // UserPlanResponse response = new UserPlanResponse();

        // response.setId(user.getId());
        // response.setClientId(user.getClientId());
        // response.setClientName(user.getClientName());
        // response.setPlanName(user.getPlan().getPlanName());
        // response.setCustomRuleEnabled(user.isCustomRuleEnabled());

        // return response;
        // });
    }

    public Page<UserPlanResponse> searchUsers(String clientName, Pageable pageable) {

        return repo.findByClientNameContainingIgnoreCase(clientName, pageable)
                .map(this::toResponse);
    }

    public UserPlanResponse updateUserPlan(
            String clientId,
            UserPlanRequest request) {

        UserPlan user = repo.findByClientId(clientId);

        if (user == null) {
            throw new ResourceNotFoundException("User not found");
        }

        RatePlan plan = planRepo.findById(request.getPlanId())
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found"));

        if (user.getPlan().getId().equals(plan.getId())) {
            throw new DuplicateResourceException("User is already using this plan");
        }

        user.setPlan(plan);
        user.setClientName(request.getClientName());
        user.setCustomRuleEnabled(request.getCustomRuleEnabled());

        UserPlan updated = repo.save(user);

        return toResponse(updated);
    }

    public UserPlanResponse patchUserPlan(
            String clientId,
            UserPlanRequest request) {
        UserPlan user = repo.findByClientId(clientId);

        if (user == null) {
            throw new ResourceNotFoundException("User not found");
        }
        if (request.getClientName() != null) {
            user.setClientName(request.getClientName());
        }
        if (request.getPlanId() != null) {
            RatePlan plan = planRepo.findById(request.getPlanId())
                    .orElseThrow(() -> new ResourceNotFoundException("Plan not found"));

            user.setPlan(plan);
        }
        if (request.getCustomRuleEnabled() != null) {
            user.setCustomRuleEnabled(request.getCustomRuleEnabled());
        }
        UserPlan updated = repo.save(user);
        return toResponse(updated);
    }

    public void deleteUserPlan(String clientId) {
        UserPlan user = repo.findByClientId(clientId);
        if (user == null) {
            throw new ResourceNotFoundException("User not found");
        }
        repo.delete(user);
    }
}