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

@Service
public class RateLimiterService {

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
            System.out.println("User not found");
            return false;
        }

        /** Check plan active */
        if (!user.getPlan().getActive()) {
            System.out.println("Plan disabled");
            return false;
        }

        /** Load default plan rule */
        RatePlanRule rule = ruleRepo.findByPlan(user.getPlan());
        if (rule == null) {
            System.out.println("Rule not found");
            return false;
        }
        int limit = rule.getMaxRequests();
        System.out.println("Limit: " + limit);
        long window = convertWindow(rule.getWindowValue(), rule.getWindowUnit());
        System.out.println("Window: " + window);

        /** Enterprise override */

        if ("ENTERPRISE".equals(user.getPlan().getPlanName()) && user.isCustomRuleEnabled()) {
            UserCustomRule custom = customRepo.findByUser(user);
            System.out.println("Custom rule enabled" + custom);
            if (custom != null) {
                limit = custom.getMaxRequests();
                System.out.println("Custom Limit: " + limit);
                window = convertWindow(custom.getWindowValue(),
                        custom.getWindowUnit());
                System.out.println("Custom Window: " + window);
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
                System.out.println("Allowed" + queue);
                return true;
            }
            System.out.println("Rate Limit Exceeded");
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
        switch (unit) {
            case "SECOND":
                return value * 1000L;
            case "MINUTE":
                return value * 60 * 1000L;
            case "HOUR":
                return value * 60 * 60 * 1000L;
            default:
                throw new RuntimeException("Invalid Window");
        }
    }
}