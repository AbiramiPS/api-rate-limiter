package com.api_rate_limiter.service;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Queue;
import java.util.LinkedList;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;


import com.api_rate_limiter.entity.RatePlanRule;
import com.api_rate_limiter.entity.UserCustomRule;
import com.api_rate_limiter.entity.UserPlan;
import com.api_rate_limiter.repository.RatePlanRuleRepository;
import com.api_rate_limiter.repository.UserCustomRuleRepository;
import com.api_rate_limiter.repository.UserPlanRepository;
import com.api_rate_limiter.exception.BadRequestException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
@Service
public class RateLimiterService {
    private static final Logger logger = LoggerFactory.getLogger(RateLimiterService.class);
    /** clientId → timestamps */
    private final Map<String, Queue<Long>> clientRequestTimes = new ConcurrentHashMap<>();

    @Autowired
    private UserPlanRepository userRepo;

    @Autowired
    private RatePlanRuleRepository ruleRepo;

    @Autowired
    private UserCustomRuleRepository customRepo;

    public boolean isRequestAllowed(String clientId) {
     
        /** Find User */
        UserPlan user = userRepo.findByClientId(clientId);
        if (user == null) {
            logger.error("User not found");
            return false;
        }

        /** Check plan active */
        if (!user.getPlan().getActive()) {
            logger.error("Plan disabled");
            return false;
        }

        /** Load default plan rule */
        RatePlanRule rule = ruleRepo.findByPlan(user.getPlan());
        if (rule == null) {
            logger.error("Rule not found");
            return false;
        }
        int limit = rule.getMaxRequests();
        logger.info("Limit: " + limit);
        long window = convertWindow(rule.getWindowValue(), rule.getWindowUnit());
        logger.info("Window: " + window);

        /** Enterprise override */

        if ("ENTERPRISE".equals(user.getPlan().getPlanName()) && user.isCustomRuleEnabled()) {
            UserCustomRule custom = customRepo.findByUser(user);
            logger.info("Custom rule enabled" + custom);
            if (custom != null) {
                limit = custom.getMaxRequests();
                logger.info("Custom Limit: " + limit);
                window = convertWindow(custom.getWindowValue(),
                        custom.getWindowUnit());
                logger.info("Custom Window: " + window);
            }
        }

        /** Sliding Window */

        long current = System.currentTimeMillis();

        // putIfAbsent - it is used To create a new queue for the client only if one
        // doesn't already exist.
        clientRequestTimes.putIfAbsent(clientId, new LinkedList<>());

        // clientRequestTimes - To get the queue that stores all request timestamps for
        // that client.
        Queue<Long> queue = clientRequestTimes.get(clientId);
        synchronized (queue) {
            cleanupOldRequests(queue, current, window);

            if (queue.size() < limit) {
                queue.offer(current);
                logger.info("Allowed" + queue);
                return true;
            }
            logger.error("Rate Limit Exceeded");
            return false;
        }
    }

    /** Cleanup expired timestamps */

    private void cleanupOldRequests(Queue<Long> queue, long current, long window) {
        while (!queue.isEmpty() && queue.peek() <= current - window) {
            queue.poll();
        }
    }

    /** Convert window */

    private long convertWindow(int value, String unit) {
        logger.info("Window Unit from DB: {}", unit);
        switch (unit) {
            case "SECOND":
                return value * 1000L;
            case "MINUTE":
                return value * 60 * 1000L;
            case "HOUR":
                return value * 60 * 60 * 1000L;
            default:
                throw new BadRequestException("Invalid Window");
                
        }
        
    }
}