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
import com.api_rate_limiter.entity.UserPlan;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/admin/user-plans")
public class UserPlanController {
    @Autowired
    private UserPlanService userPlanService;


    @GetMapping("/{clientId}")
    public ResponseEntity<UserPlan> getUserPlan(@PathVariable String clientId) {
        UserPlan userPlan = userPlanService.getUserPlan(clientId);
        if (userPlan != null) {
            return new ResponseEntity<>(userPlan, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }
    @PostMapping
    public ResponseEntity<UserPlan> createUserPlan(@RequestBody UserPlan userPlan) {
        UserPlan savedUserPlan = userPlanService.saveUserPlan(userPlan);
        return new ResponseEntity<>(savedUserPlan, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<UserPlan>> getAll(){
        return ResponseEntity.ok(userPlanService.getAll());
    }

}
