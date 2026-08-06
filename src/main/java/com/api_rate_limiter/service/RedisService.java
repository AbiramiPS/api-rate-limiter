package com.api_rate_limiter.service;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class RedisService {
    @Autowired
    public RedisTemplate<String,Integer> redisTemplate;

    public void saveValue(String key, Integer value) {
        redisTemplate.opsForValue().set(key, value);
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

}
