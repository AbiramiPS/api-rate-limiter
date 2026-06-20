package com.api_rate_limiter.controller;

import org.springframework.web.bind.annotation.*;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.http.*;

import com.api_rate_limiter.entity.UserCustomRule;
import com.api_rate_limiter.entity.UserPlan;

import com.api_rate_limiter.service.UserCustomRuleService;
import com.api_rate_limiter.service.UserPlanService;

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

    public ResponseEntity<UserCustomRule> getCustomRule(

            @PathVariable String clientId

    ) {

        UserPlan user = userPlanService
                .getUserPlan(
                        clientId);

        if (user == null) {

            return ResponseEntity
                    .notFound()
                    .build();

        }

        UserCustomRule rule = customService
                .getRule(
                        user);

        if (rule == null) {

            return ResponseEntity
                    .notFound()
                    .build();

        }

        return ResponseEntity
                .ok(
                        rule);

    }

    /*
     * CREATE CUSTOM RULE
     */

    @PostMapping

    public ResponseEntity<UserCustomRule> createRule(

            @RequestBody UserCustomRule rule

    ) {

        UserCustomRule saved = customService
                .saveRule(
                        rule);

        return ResponseEntity
                .status(
                        HttpStatus.CREATED)

                .body(
                        saved);

    }

}