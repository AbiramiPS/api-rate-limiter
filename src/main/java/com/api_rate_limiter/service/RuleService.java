package com.api_rate_limiter.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

import com.api_rate_limiter.entity.RatePlanRule;
import com.api_rate_limiter.repository.RuleRepository;

@Service
public class RuleService {

@Autowired
private RuleRepository ruleRepository;

public RatePlanRule
getRuleByPlan(
String plan
){

return ruleRepository
.findByPlan(
plan
);

}

public RatePlanRule
saveRule(
RatePlanRule rule
){

return ruleRepository
.save(
rule
);

}

}