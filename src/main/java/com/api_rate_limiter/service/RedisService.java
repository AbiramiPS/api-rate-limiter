package com.api_rate_limiter.service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;

import com.api_rate_limiter.dto.response.RedisRuleCacheResponse;


import com.api_rate_limiter.dto.response.RedisHealthDto;
import com.api_rate_limiter.dto.response.RedisKeyInfoDto;
import org.springframework.data.redis.connection.RedisConnectionFactory;
@Service
public class RedisService {
    @Autowired
    public RedisTemplate<String,Integer> redisTemplate;
    // Used for cached rules
    @Autowired
    private RedisTemplate<String, RedisRuleCacheResponse> redisRuleCacheTemplate;

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
    // public long getRemainingTime(String clientId) {

    //     String key = "rate_limit:" + clientId;

    //     return redisTemplate.getExpire(key);
    // }

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

    public long getRemainingTime(String clientId) {
        String key = "rate_limit:" + clientId;

        Long ttl = redisTemplate.getExpire(key);

        return ttl == null ? -1 : ttl;
    }
        // =========================================================
    // RATE RULE CACHE
    // =========================================================

    public void saveCachedRule(
            String clientId,
            RedisRuleCacheResponse rule) {

        String key = "rate_rule:" + clientId;

        redisRuleCacheTemplate
                .opsForValue()
                .set(
                        key,
                        rule,
                        Duration.ofMinutes(10)
                );
    }


    public RedisRuleCacheResponse getCachedRule(
            String clientId) {

        String key = "rate_rule:" + clientId;

        return redisRuleCacheTemplate
                .opsForValue()
                .get(key);
    }


    public void deleteCachedRule(
            String clientId) {

        String key = "rate_rule:" + clientId;

        redisRuleCacheTemplate.delete(key);
    }

    /**
     * Retrieve health information about the Redis server.
     */
    public RedisHealthDto getHealthInfo() {
        RedisHealthDto health = new RedisHealthDto();
        try {
            RedisConnection connection = connectionFactory.getConnection();
            health.setConnected(true);
            java.util.Properties info = connection.info();
            health.setRedisVersion(info.getProperty("redis_version", ""));
            String usedMemoryStr = info.getProperty("used_memory");
            if (usedMemoryStr != null) {
                try { health.setMemoryUsed(Long.parseLong(usedMemoryStr)); } catch (NumberFormatException e) { health.setMemoryUsed(0L); }
            }
            Long dbSize = connection.dbSize();
            health.setTotalKeys(dbSize != null ? dbSize.intValue() : 0);
        } catch (Exception e) {
            health.setConnected(false);
            health.setRedisVersion("unknown");
            health.setMemoryUsed(0L);
            health.setTotalKeys(0);
        }
        return health;
    }

    /**
     * List all rate‑limit counter keys with values and TTLs.
     */
    public java.util.List<RedisKeyInfoDto> listCounters() {
        java.util.List<RedisKeyInfoDto> result = new java.util.ArrayList<>();
        Set<String> keys = redisTemplate.keys("rate_limit:*");
        if (keys != null) {
            for (String key : keys) {
                Integer value = redisTemplate.opsForValue().get(key);
                Long ttl = redisTemplate.getExpire(key);
                String clientId = key.replaceFirst("rate_limit:", "");
                RedisKeyInfoDto dto = new RedisKeyInfoDto();
                dto.setKey(key);
                dto.setCategory("COUNTER");
                dto.setValue(value != null ? value.toString() : "null");
                dto.setTtl(ttl);
                dto.setClientId(clientId);
                result.add(dto);
            }
        }
        return result;
    }

    /**
     * List all cached rule keys with JSON value and TTLs.
     */
    public java.util.List<RedisKeyInfoDto> listRules() {
        java.util.List<RedisKeyInfoDto> result = new java.util.ArrayList<>();
        Set<String> keys = redisTemplate.keys("rate_rule:*");
        if (keys != null) {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            for (String key : keys) {
                RedisRuleCacheResponse rule = redisRuleCacheTemplate.opsForValue().get(key);
                Long ttl = redisRuleCacheTemplate.getExpire(key);
                String clientId = key.replaceFirst("rate_rule:", "");
                String json = "";
                try { json = mapper.writeValueAsString(rule); } catch (Exception e) { json = "" + rule; }
                RedisKeyInfoDto dto = new RedisKeyInfoDto();
                dto.setKey(key);
                dto.setCategory("RULE");
                dto.setValue(json);
                dto.setTtl(ttl);
                dto.setClientId(clientId);
                result.add(dto);
            }
        }
        return result;
    }

    /**
     * Reset a single client's rate‑limit counter without affecting rule cache.
     */
    public void resetRateLimitCounter(String clientId) {
        if (clientId == null || clientId.isEmpty()) return;
        redisTemplate.delete("rate_limit:" + clientId);
    }

    /**
     * Flush only this application's keys (counters and rule caches).
     */
    public void flushAppKeys() {
        Set<String> counterKeys = redisTemplate.keys("rate_limit:*");
        if (counterKeys != null && !counterKeys.isEmpty()) {
            redisTemplate.delete(counterKeys);
        }
        Set<String> ruleKeys = redisTemplate.keys("rate_rule:*");
        if (ruleKeys != null && !ruleKeys.isEmpty()) {
            redisTemplate.delete(ruleKeys);
        }
    }

}
