package com.api_rate_limiter.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import com.api_rate_limiter.entity.RatePlan;
import com.api_rate_limiter.service.RatePlanService;

@RestController

@RequestMapping("/admin/plans")

public class RatePlanController {
        @Autowired
        private RatePlanService ratePlanService;

        /** GET PLAN */
        @GetMapping("/{planName}")

        public ResponseEntity<RatePlan> getPlan(@PathVariable String planName) {
                RatePlan plan = ratePlanService.getPlan(planName);
                if (plan == null) {
                        return ResponseEntity.notFound().build();
                }
                return ResponseEntity.ok(plan);
        }

        /** CREATE PLAN */

        @PostMapping

        public ResponseEntity<RatePlan> createPlan(@RequestBody RatePlan plan) {
                RatePlan saved = ratePlanService.savePlan(plan);
                return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        }

        /** GET ALL PLANS */

        @GetMapping

        public ResponseEntity<java.util.List<RatePlan>> getAll() {
                return ResponseEntity.ok(ratePlanService.getAll());
        }
}