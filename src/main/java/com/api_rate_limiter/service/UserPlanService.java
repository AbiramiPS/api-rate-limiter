package com.api_rate_limiter.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import com.api_rate_limiter.entity.UserPlan;
import com.api_rate_limiter.dto.request.UserPlanRequest;
import com.api_rate_limiter.dto.request.UserCustomRuleRequest;
import com.api_rate_limiter.dto.response.UserPlanResponse;
import com.api_rate_limiter.entity.RatePlan;
import com.api_rate_limiter.entity.UserCustomRule;
import com.api_rate_limiter.repository.UserPlanRepository;
import com.api_rate_limiter.repository.RatePlanRepository;
import com.api_rate_limiter.repository.UserCustomRuleRepository;
import com.api_rate_limiter.exception.DuplicateResourceException;
import com.api_rate_limiter.exception.ResourceNotFoundException;
import java.util.List;
import org.springframework.data.domain.Page;

@Service
public class UserPlanService {

    @Autowired
    private UserPlanRepository repo;

    @Autowired
    private RatePlanRepository planRepo;

    @Autowired
    private UserCustomRuleService customRuleService;

    @Autowired
    private UserCustomRuleRepository customRuleRepo;

    @Autowired
    private RedisService redisService;

    private UserPlanResponse toResponse(UserPlan user) {

        UserPlanResponse response = new UserPlanResponse();

        response.setId(user.getId());
        response.setClientId(user.getClientId());
        response.setClientName(user.getClientName());
        response.setPlanName(user.getPlan().getPlanName());
        response.setCustomRuleEnabled(user.isCustomRuleEnabled());

        return response;
    }

    @Transactional
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
        
        boolean customEnabled = "CUSTOM".equalsIgnoreCase(request.getRateLimitMode());
        user.setCustomRuleEnabled(customEnabled);
        user.setPlan(plan);
        UserPlan saved = repo.save(user);

        if (customEnabled && request.getCustomRule() != null) {
            UserCustomRuleRequest ruleReq = request.getCustomRule();
            ruleReq.setUserPlanId(saved.getId());
            customRuleService.saveRule(ruleReq);
        }

        return toResponse(saved);
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

    @Transactional
    public UserPlanResponse updateUserPlan(
            String clientId,
            UserPlanRequest request) {

        UserPlan user = repo.findByClientId(clientId);

        if (user == null) {
            throw new ResourceNotFoundException("User not found");
        }

        RatePlan plan = planRepo.findById(request.getPlanId())
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found"));

        user.setPlan(plan);
        user.setClientName(request.getClientName());
        
        boolean customEnabled = "CUSTOM".equalsIgnoreCase(request.getRateLimitMode());
        user.setCustomRuleEnabled(customEnabled);

        UserPlan updated = repo.save(user);

        if (customEnabled && request.getCustomRule() != null) {
            UserCustomRuleRequest ruleReq = request.getCustomRule();
            ruleReq.setUserPlanId(updated.getId());

            UserCustomRule existingRule = customRuleRepo.findByUser(updated);
            if (existingRule != null) {
                customRuleService.updateRule(clientId, ruleReq);
            } else {
                customRuleService.saveRule(ruleReq);
            }
        } else {
            // Set existing custom rule to inactive if it exists
            UserCustomRule existingRule = customRuleRepo.findByUser(updated);
            if (existingRule != null) {
                existingRule.setActive(false);
                customRuleRepo.save(existingRule);
                redisService.deleteCachedRule(updated.getClientId());
            }
        }

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