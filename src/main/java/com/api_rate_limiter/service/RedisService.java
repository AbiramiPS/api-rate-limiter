package com.api_rate_limiter.service;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
@Service
public class RedisService {
    @Autowired
    public RedisTemplate<String,Integer> redisTemplate;

    @Autowired
private RedisConnectionFactory connectionFactory;

@GetMapping("/redis-info")
public String redisInfo() {

    return "Redis Factory = "
            + connectionFactory.getClass().getName();
}
    
    public Integer getValue(String key) {
        return redisTemplate.opsForValue().get(key);
    }

    // Step 8
    public Long increment(String key) {
        return redisTemplate.opsForValue().increment(key);
    }

    // Step 9
    public void setExpiry(String key) {
        redisTemplate.expire(key, Duration.ofMinutes(1));
    }


    public int incrementRequest(String clientId, long windowSeconds) {

        String key = "rate_limit:" + clientId;

        Long count = redisTemplate.opsForValue().increment(key);

        // First request -> set expiry
        if (count != null && count == 1) {
            redisTemplate.expire(key, Duration.ofSeconds(windowSeconds));
        }

        return count.intValue();
    }

    /**
     * Current request count.
     */
    public int getRequestCount(String clientId) {

        String key = "rate_limit:" + clientId;

        Integer count = redisTemplate.opsForValue().get(key);

        return count == null ? 0 : count;
    }

    /**
     * Remaining TTL.
     */
    public long getRemainingTime(String clientId) {

        String key = "rate_limit:" + clientId;

        return redisTemplate.getExpire(key);
    }

    /**
     * Reset counter manually.
     */
    public void resetCounter(String clientId) {

        redisTemplate.delete("rate_limit:" + clientId);

    }

    public void saveValue(String key, Integer value) {

        redisTemplate.opsForValue().set(key, value);

        System.out.println("Saved Key : " + key);
        System.out.println("Saved Value : " + value);
        System.out.println("Keys in Redis : " + redisTemplate.keys("*"));
    }

}
