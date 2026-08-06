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
}