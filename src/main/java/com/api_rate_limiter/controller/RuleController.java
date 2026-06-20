package com.api_rate_limiter.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import com.api_rate_limiter.service.RuleService;
import com.api_rate_limiter.entity.RatePlanRule;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/admin/rules")
public class RuleController {
    @Autowired
    private RuleService ruleService;

    // http://localhost:8082/admin/rules?plan=basic
    @GetMapping("/{plan}")
    public ResponseEntity<RatePlanRule> getRuleByPlan(@PathVariable String plan) {
        RatePlanRule rule = ruleService.getRuleByPlan(plan);
        if (rule != null) {
            return new ResponseEntity<>(rule, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @PostMapping
    public ResponseEntity<RatePlanRule> createRule(@RequestBody RatePlanRule rule) {
        RatePlanRule savedRule = ruleService.saveRule(rule);
        return new ResponseEntity<>(savedRule, HttpStatus.CREATED);
    }

    
}