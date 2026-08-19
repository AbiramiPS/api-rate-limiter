// package com.api_rate_limiter.controller;

// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.data.redis.connection.RedisConnectionFactory;
// import org.springframework.data.redis.core.RedisTemplate;
// import org.springframework.web.bind.annotation.GetMapping;
// import org.springframework.web.bind.annotation.RequestMapping;
// import org.springframework.web.bind.annotation.RestController;
// import com.api_rate_limiter.service.RedisService;
// import java.util.Set;
// @RestController
// @RequestMapping("/admin/redis")
// public class RedisTestController {
//     @Autowired
//     private RedisService redisService;

//     public void saveValue(String key, Integer value) {

//         System.out.println("Saving...");

//         redisTemplate.opsForValue().set(key, value);

//         System.out.println("Saved");

//         System.out.println("Keys = " + redisTemplate.keys("*"));

//     }

//     public Integer getValue(String key) {

//         Integer value = redisTemplate.opsForValue().get(key);

//         System.out.println("Value = " + value);

//         System.out.println("Keys = " + redisTemplate.keys("*"));

//         return value;

//     }

//     @GetMapping("/increment")
//     public Long increment() {

//         return redisService.increment("client:C001");

//     }

//     @GetMapping("/test")
//     public String test() {

//         redisService.saveValue("hello", 123);

//         Integer value = redisService.getValue("hello");

//         return "Value = " + value;
//     }

//     @Autowired
//     private RedisConnectionFactory factory;

//     @GetMapping("/connection")
//     public String connection() {
//         return factory.getConnection().ping();
//     }

//     @Autowired
//     private RedisTemplate<String, Integer> redisTemplate;

//     @GetMapping("/debug")
//     public String debug() {

//         redisTemplate.opsForValue().set("testKey", 999);

//         System.out.println(redisTemplate.keys("*"));

//         return redisTemplate.opsForValue().get("testKey").toString();
//     }
    
    
//     @GetMapping("/keys")
//     public Set<String> keys() {
//         return redisService.redisTemplate.keys("*");
//     }
    
//     @GetMapping("/host")
//     public String host() {
//         return redisService.redisTemplate
//                 .getConnectionFactory()
//                 .getConnection()
//                 .getNativeConnection()
//                 .toString();
//     }
    
//     @GetMapping("/cli-test")
//     public Integer cliTest() {
//         return redisService.redisTemplate.opsForValue().get("cli-test");
//     }
    
//     @GetMapping("/docker-test")
//     public Integer dockerTest() {

//         Integer value = redisService.redisTemplate
//                 .opsForValue()
//                 .get("spring-check");

//         System.out.println("spring-check value = " + value);

//         return value;
//     }
// }


package com.api_rate_limiter.controller;

import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.api_rate_limiter.dto.response.RedisRateLimitResultResponse;
import com.api_rate_limiter.service.RedisRateLimiterService;
import com.api_rate_limiter.service.RedisService;

@RestController
@RequestMapping("/admin/redis")
public class RedisTestController {

    @Autowired
    private RedisService redisService;

    @Autowired
    private RedisConnectionFactory connectionFactory;

    @Autowired
    private RedisRateLimiterService rateLimiterService;

    @GetMapping("/test")
    public String test() {

        redisService.saveValue("hello", 123);

        Integer value = redisService.getValue("hello");

        return "Value = " + value;
    }

    @GetMapping("/keys")
    public Set<String> keys() {

        return redisService.redisTemplate.keys("*");
    }

    @GetMapping("/docker-test")
    public ResponseEntity<Void> dockerTest(
            @RequestHeader(value = "X-clientId", required = false) String clientId,
            jakarta.servlet.http.HttpServletResponse response) {

        if (clientId == null || clientId.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        // Run the actual rate-limiting algorithm
        RedisRateLimitResultResponse result = rateLimiterService.checkRateLimit(clientId);

        // Add standard rate limit headers
        response.setHeader("X-RateLimit-Limit", String.valueOf(result.getLimit()));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(result.getRemaining()));
        response.setHeader("X-RateLimit-Reset", String.valueOf(result.getResetTime()));

        if (!result.isAllowed()) {
            return ResponseEntity.status(429).build();
        }

        return ResponseEntity.ok().build();
    }

    @GetMapping("/redis-info")
    public String redisInfo() {

        return "Redis Factory = "
                + connectionFactory.getClass().getName();
    }
}