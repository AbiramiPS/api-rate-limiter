package com.api_rate_limiter.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;

import com.api_rate_limiter.dto.response.RatePlanResponse;
import com.api_rate_limiter.entity.RatePlan;
import com.api_rate_limiter.service.RatePlanService;
import com.api_rate_limiter.dto.request.RatePlanRequest;
import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
@RestController

@RequestMapping("/admin/plans")

public class RatePlanController {
        @Autowired
        private RatePlanService ratePlanService;

        /** GET PLAN */
        @GetMapping("/{planName}")

        public ResponseEntity<RatePlanResponse> getPlan(@PathVariable String planName) {
           
                return ResponseEntity.ok(ratePlanService.getPlan(planName));
        }

        /** CREATE PLAN */

        @PostMapping

        public ResponseEntity<RatePlanResponse> createPlan(@Valid  @RequestBody RatePlanRequest request) {
                RatePlanResponse  saved = ratePlanService.savePlan(request);
                return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        }

        /** GET ALL PLANS */

        @GetMapping

        public ResponseEntity<Page<RatePlanResponse>> getAll(Pageable pageable) {
                return ResponseEntity.ok(ratePlanService.getAll(pageable));
        }
}