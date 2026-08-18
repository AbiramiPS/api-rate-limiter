package com.api_rate_limiter.controller;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.api_rate_limiter.service.UserPlanService;
import org.springframework.web.bind.annotation.RequestBody;
import com.api_rate_limiter.dto.request.UserPlanRequest;
import com.api_rate_limiter.dto.response.UserPlanResponse;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.Operation;

@RestController
@RequestMapping("/admin/user-plans")
public class UserPlanController {
    @Autowired
    private UserPlanService userPlanService;

@Operation(
    summary = "Get user plan",
    description = "Retrieves the rate plan and custom rule configuration for a client."
)
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
    public ResponseEntity<Page<UserPlanResponse>> getAll(Pageable pageable) {
        
        System.out.println("Page = " + pageable.getPageNumber());
        System.out.println("Size = " + pageable.getPageSize());
        System.out.println("Sort = " + pageable.getSort());

        return ResponseEntity.ok(userPlanService.getAll(pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<UserPlanResponse>> searchUsers(
        @RequestParam String clientName,
        Pageable pageable) {

        return ResponseEntity.ok(
            userPlanService.searchUsers(clientName, pageable));
}
 @PutMapping("/{clientId}")
    public ResponseEntity<UserPlanResponse> updateUserPlan(
        @PathVariable String clientId,
        @Valid @RequestBody UserPlanRequest request) {
        return ResponseEntity.ok(userPlanService.updateUserPlan(clientId, request));
    }
    @PatchMapping("/{clientId}")
public ResponseEntity<UserPlanResponse> patchUserPlan(
        @PathVariable String clientId,
        @RequestBody UserPlanRequest request){

    return ResponseEntity.ok(
            userPlanService.patchUserPlan(clientId, request));
}
@DeleteMapping("/{clientId}")
public ResponseEntity<String> deleteUserPlan(
        @PathVariable String clientId) {
    userPlanService.deleteUserPlan(clientId);
    return ResponseEntity.ok("User deleted successfully");
}
}