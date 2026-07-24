package com.api_rate_limiter.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.api_rate_limiter.service.UserPlanService;
import org.springframework.web.bind.annotation.RequestBody;
import com.api_rate_limiter.dto.request.UserPlanRequest;
import com.api_rate_limiter.dto.response.UserPlanResponse;
import jakarta.validation.Valid;
@RestController
@RequestMapping("/admin/user-plans")
public class UserPlanController {
    @Autowired
    private UserPlanService userPlanService;


    @GetMapping("/{clientId}")
    public ResponseEntity<UserPlanResponse> getUserPlan(@PathVariable String clientId) {
        return ResponseEntity.ok(userPlanService.getUserPlan(clientId));
        }
   
    @PostMapping
    public ResponseEntity<UserPlanResponse> createUserPlan(@Valid @RequestBody UserPlanRequest request) {
        UserPlanResponse savedUserPlan = userPlanService.saveUserPlan(request);
        return new ResponseEntity<>(savedUserPlan, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<UserPlanResponse>> getAll(){
        return ResponseEntity.ok(userPlanService.getAll());
    }
}
