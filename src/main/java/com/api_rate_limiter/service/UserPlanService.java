package com.api_rate_limiter.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

import com.api_rate_limiter.entity.UserPlan;
import com.api_rate_limiter.repository.UserPlanRepository;

@Service
public class UserPlanService {

@Autowired
private UserPlanRepository repo;

public UserPlan
getUserPlan(
String clientId
){

return repo
.findByClientId(
clientId
);

}

public UserPlan
saveUserPlan(
UserPlan user
){

return repo
.save(
user
);

}

}