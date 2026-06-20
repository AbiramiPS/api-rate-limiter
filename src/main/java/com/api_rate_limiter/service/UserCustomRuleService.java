package com.api_rate_limiter.service;

import org.springframework.stereotype.Service;

import org.springframework.beans.factory.annotation.Autowired;

import com.api_rate_limiter.entity.UserCustomRule;
import com.api_rate_limiter.entity.UserPlan;
import com.api_rate_limiter.repository.UserCustomRuleRepository;

@Service
public class UserCustomRuleService {

@Autowired
private UserCustomRuleRepository repo;

public UserCustomRule
getRule(
UserPlan user
){

return repo
.findByUser(
user
);

}

public UserCustomRule saveRule(
        UserCustomRule rule) {

    rule.setId(
            null);

return repo
.save(
rule
);

}

}