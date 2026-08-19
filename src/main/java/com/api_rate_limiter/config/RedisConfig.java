package com.api_rate_limiter.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;

import org.springframework.data.redis.serializer.GenericToStringSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;

import com.api_rate_limiter.dto.response.RedisRuleCacheResponse;

@Configuration
public class RedisConfig {

    /*
     * Rate-limit counter
     */
    @Bean
    public RedisTemplate<String, Integer> redisTemplate(
            RedisConnectionFactory connectionFactory) {

        RedisTemplate<String, Integer> template = new RedisTemplate<>();

        template.setConnectionFactory(connectionFactory);

        template.setKeySerializer(
                new StringRedisSerializer());

        template.setValueSerializer(
                new GenericToStringSerializer<>(Integer.class));

        template.afterPropertiesSet();

        return template;
    }

    /*
     * Rate-limit rule cache
     */
    @Bean
    public RedisTemplate<String, RedisRuleCacheResponse> redisRuleCacheTemplate(
            RedisConnectionFactory connectionFactory) {

        RedisTemplate<String, RedisRuleCacheResponse> template = new RedisTemplate<>();

        template.setConnectionFactory(connectionFactory);

        template.setKeySerializer(
                new StringRedisSerializer());

        Jackson2JsonRedisSerializer<RedisRuleCacheResponse> jsonSerializer = new Jackson2JsonRedisSerializer<>(
                RedisRuleCacheResponse.class);

        template.setValueSerializer(jsonSerializer);

        template.afterPropertiesSet();

        return template;
    }

    @Bean
    public RedisTemplate<String, String> redisEventTemplate(
            RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, String> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new StringRedisSerializer());
        template.afterPropertiesSet();
        return template;
    }
}