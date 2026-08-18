package com.api_rate_limiter.controller.admin;

import com.api_rate_limiter.dto.response.RedisHealthDto;
import com.api_rate_limiter.dto.response.RedisKeyInfoDto;
import com.api_rate_limiter.service.RedisService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/redis")
@PreAuthorize("hasRole('ADMIN')")
public class AdminRedisController {

    @Autowired
    private RedisService redisService;

    @GetMapping("/health")
    public ResponseEntity<RedisHealthDto> health() {
        return ResponseEntity.ok(redisService.getHealthInfo());
    }

    @GetMapping("/counters")
    public ResponseEntity<List<RedisKeyInfoDto>> counters() {
        return ResponseEntity.ok(redisService.listCounters());
    }

    @GetMapping("/rules")
    public ResponseEntity<List<RedisKeyInfoDto>> rules() {
        return ResponseEntity.ok(redisService.listRules());
    }

    @DeleteMapping("/rate-limit/{clientId}")
    public ResponseEntity<Void> resetCounter(@PathVariable String clientId) {
        redisService.resetRateLimitCounter(clientId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/flush-all")
    public ResponseEntity<Void> flushAll() {
        redisService.flushAppKeys();
        return ResponseEntity.noContent().build();
    }
}
