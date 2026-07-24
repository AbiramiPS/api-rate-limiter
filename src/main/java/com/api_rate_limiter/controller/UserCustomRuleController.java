package com.api_rate_limiter.controller;

import org.springframework.web.bind.annotation.*;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.http.*;

import com.api_rate_limiter.dto.request.UserCustomRuleRequest;
import com.api_rate_limiter.dto.response.UserCustomRuleResponse;
import com.api_rate_limiter.dto.response.UserPlanResponse;
import com.api_rate_limiter.entity.UserCustomRule;
import com.api_rate_limiter.entity.UserPlan;

import com.api_rate_limiter.service.UserCustomRuleService;
import com.api_rate_limiter.service.UserPlanService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/admin/custom-rules")

public class UserCustomRuleController {

    @Autowired
    private UserCustomRuleService customService;

    @Autowired
    private UserPlanService userPlanService;

    /*
     * GET CUSTOM RULE
     */

    @GetMapping("/{clientId}")


public ResponseEntity<UserCustomRuleResponse> getCustomRule(@PathVariable String clientId) {

    UserPlan user = userPlanService.getUserPlanEntity(clientId);

    UserCustomRuleResponse response = customService.getRule(user.getId());

    return ResponseEntity.ok(response);
    }

    /*
     * CREATE CUSTOM RULE
     */

  
@PostMapping
public ResponseEntity<UserCustomRuleResponse> createRule(
        @Valid @RequestBody UserCustomRuleRequest request) {

    UserCustomRuleResponse response = customService.saveRule(request);

    return ResponseEntity.status(HttpStatus.CREATED).body(response);
}
}