package com.api_rate_limiter.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

import com.api_rate_limiter.entity.UserPlan;
import com.api_rate_limiter.entity.RatePlan;

import com.api_rate_limiter.repository.UserPlanRepository;
import com.api_rate_limiter.repository.RatePlanRepository;

@Service
public class UserPlanService {

@Autowired
private UserPlanRepository repo;

@Autowired
private RatePlanRepository planRepo;

public UserPlan saveUserPlan(
UserPlan user
){

Long planId =
user
.getPlan()
.getId();

RatePlan plan =

planRepo
.findById(
planId
)

.orElseThrow(
()->new RuntimeException(
"Plan not found"
)
);

user.setPlan(
plan
);

return repo.save(
user
);

}

public UserPlan getUserPlan(
String clientId
){

return repo.findByClientId(
clientId
);

}

}