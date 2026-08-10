package com.api_rate_limiter.service;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.api_rate_limiter.dto.request.UserCustomRuleRequest;
import com.api_rate_limiter.dto.response.UserCustomRuleResponse;
import com.api_rate_limiter.entity.UserCustomRule;
import com.api_rate_limiter.entity.UserPlan;
import com.api_rate_limiter.exception.ResourceNotFoundException;
import com.api_rate_limiter.mapper.UserCustomRuleMapper;
import com.api_rate_limiter.repository.UserCustomRuleRepository;
import com.api_rate_limiter.repository.UserPlanRepository;

@Service
public class UserCustomRuleService {

    @Autowired
    private UserCustomRuleRepository repo;

    @Autowired
    private UserPlanRepository userRepo;

    @Autowired
    private UserCustomRuleMapper mapper;

    /* GET */

    public UserCustomRuleResponse getRule(Long userPlanId) {

        UserPlan user = userRepo.findById(userPlanId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        UserCustomRule rule = repo.findByUser(user);

        if (rule == null) {
            throw new ResourceNotFoundException("Custom rule not found");
        }

        return mapper.toResponse(rule);
    }

    /* CREATE */

    public UserCustomRuleResponse saveRule(UserCustomRuleRequest request) {

        UserPlan user = userRepo.findById(request.getUserPlanId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        UserCustomRule rule = mapper.toEntity(request);

        rule.setUser(user);
        rule.setCreatedAt(LocalDateTime.now());
        rule.setUpdatedAt(LocalDateTime.now());

        UserCustomRule saved = repo.save(rule);

        return mapper.toResponse(saved);
    }

    /* SEARCH */

    public Page<UserCustomRuleResponse> searchUsers(
            String clientName,
            Pageable pageable) {

        return repo.findByUser_ClientNameContainingIgnoreCase(
                clientName,
                pageable)
                .map(mapper::toResponse);
    }

    public void deleteRule(String clientId) {

        // Find the user
        UserPlan user = userRepo.findByClientId(clientId);

        if (user == null) {
            throw new ResourceNotFoundException("User not found");
        }

        // Find the user's custom rule
        UserCustomRule rule = repo.findByUser(user);

        if (rule == null) {
            throw new ResourceNotFoundException("Custom rule not found");
        }
        if (!user.getPlan().getPlanName().equalsIgnoreCase("ENTERPRISE")) {
            throw new IllegalArgumentException(
                    "Only Enterprise users can have custom rules.");
        }

        
        // Delete the custom rule
        repo.delete(rule);

        // Disable custom rule so default Enterprise rule will be used
        user.setCustomRuleEnabled(false);

        // Save the user
        userRepo.save(user);
    }

    public UserCustomRuleResponse updateRule(
            String clientId,
            UserCustomRuleRequest request) {

        // Find the user
        UserPlan user = userRepo.findByClientId(clientId);

        if (user == null) {
            throw new ResourceNotFoundException("User not found");
        }

        // Only Enterprise users can have custom rules
        if (!user.getPlan().getPlanName().equalsIgnoreCase("ENTERPRISE")) {
            throw new IllegalArgumentException(
                    "Custom rules are allowed only for Enterprise users.");
        }

        // Find existing custom rule
        UserCustomRule rule = repo.findByUser(user);

        if (rule == null) {
            throw new ResourceNotFoundException("Custom rule not found");
        }

        // Update all fields
        rule.setPrice(request.getPrice());
        rule.setMaxRequests(request.getMaxRequests());
        rule.setWindowValue(request.getWindowValue());
        rule.setWindowUnit(request.getWindowUnit());
        rule.setActive(request.getActive());
        rule.setUpdatedAt(LocalDateTime.now());

        // Ensure the flag is enabled
        user.setCustomRuleEnabled(true);
        userRepo.save(user);

        UserCustomRule updated = repo.save(rule);

        return mapper.toResponse(updated);
    }
    //for redis
    public UserCustomRule getRuleEntity(UserPlan user) {

        UserCustomRule rule = repo.findByUser(user);

        if (rule == null) {
            throw new ResourceNotFoundException("Custom rule not found");
        }

        return rule;
    }

}