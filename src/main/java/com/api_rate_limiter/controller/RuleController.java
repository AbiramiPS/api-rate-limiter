package com.api_rate_limiter.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import com.api_rate_limiter.service.RuleService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;

import com.api_rate_limiter.dto.request.RatePlanRuleRequest;
import com.api_rate_limiter.dto.response.RatePlanRuleResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
@RestController
@RequestMapping("/admin/rules")
public class RuleController {
    @Autowired
    private RuleService ruleService;

    // http://localhost:8082/admin/rules?plan=basic
 @GetMapping("/{planId}")
public ResponseEntity<RatePlanRuleResponse> getRule(
        @PathVariable Long planId) {

    RatePlanRuleResponse response = ruleService.getRule(planId);

    return ResponseEntity.ok(response);
}


    @PostMapping
   public ResponseEntity<RatePlanRuleResponse> createRule(
       @Valid @RequestBody RatePlanRuleRequest request){
       RatePlanRuleResponse response = ruleService.saveRule(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/search")
    public ResponseEntity<Page<RatePlanRuleResponse>> searchRules(@RequestParam String planName, Pageable pageable) {
        return ResponseEntity.ok(ruleService.searchRules(planName, pageable));
    }

    @GetMapping
    public ResponseEntity<Page<RatePlanRuleResponse>> getAll(Pageable pageable) {
        return ResponseEntity.ok(ruleService.getAll(pageable));
    }
}