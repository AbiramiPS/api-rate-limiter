package com.api_rate_limiter.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

import com.api_rate_limiter.dto.response.UserCustomRuleResponse;
import com.api_rate_limiter.entity.UserCustomRule;
import com.api_rate_limiter.entity.UserPlan;
import com.api_rate_limiter.exception.ResourceNotFoundException;
import com.api_rate_limiter.repository.UserCustomRuleRepository;
import com.api_rate_limiter.repository.UserPlanRepository;
import com.api_rate_limiter.mapper.UserCustomRuleMapper;
import com.api_rate_limiter.dto.request.UserCustomRuleRequest;

@Service
public class UserCustomRuleService {

@Autowired
private UserCustomRuleRepository repo;

@Autowired
private UserPlanRepository userRepo;
@Autowired
private UserCustomRuleMapper mapper;
/*GET*/
public UserCustomRuleResponse getRule(Long userId) {

    UserPlan user = userRepo.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

    UserCustomRule rule = repo.findByUser(user);

    if (rule == null) {
        throw new ResourceNotFoundException("Custom rule not found");
    }

    return mapper.toResponse(rule);
}

/* SAVE */
public UserCustomRuleResponse saveRule(UserCustomRuleRequest request) {
    UserPlan user = userRepo.findById(request.getId())
            .orElseThrow(() ->
                    new ResourceNotFoundException("User not found"));
    UserCustomRule rule = mapper.toEntity(request);
    rule.setUser(user);
    UserCustomRule saved = repo.save(rule);
    return mapper.toResponse(saved);
}
}