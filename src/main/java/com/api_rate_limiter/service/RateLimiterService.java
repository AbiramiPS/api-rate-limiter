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
import com.api_rate_limiter.repository.RuleRepository;
import com.api_rate_limiter.entity.RatePlan;


@Service
public class RateLimiterService {

    /*
     * clientId
     * →
     * timestamps
     */
    private final Map<String, Queue<Long>> clientRequestTimes = new ConcurrentHashMap<>();

    @Autowired
    private UserPlanRepository userRepo;

    @Autowired
    private RatePlanRuleRepository ruleRepo;

    @Autowired
    private UserCustomRuleRepository customRepo;

    public boolean isRequestAllowed(
            String clientId) {

        /*
         * Find User
         */

        UserPlan user = userRepo
                .findByClientId(
                        clientId);

        if (user == null) {

            System.out.println(
                    "User not found");

            return false;

        }

        /*
         * Check plan active
         */

        if (!user
                .getPlan()
                .getActive()) {

            System.out.println(
                    "Plan disabled");

            return false;

        }

        /*
         * Load default plan rule
         */

        RatePlanRule rule = ruleRepo
                .findByPlan(
                        user.getPlan());

        if (rule == null) {

            System.out.println(
                    "Rule not found");

            return false;

        }

        int limit = rule
                .getMaxRequests();

        long window = convertWindow(

                rule
                        .getWindowValue(),

                rule
                        .getWindowUnit()

        );

        /*
         * Enterprise override
         */

        
        if ("ENTERPRISE".equals(user.getPlan().getPlanName())
                        && user.isCustomRuleEnabled()) {
            UserCustomRule custom =

                    customRepo
                            .findByUser(
                                    user);

            if (custom != null) {

                limit = custom
                        .getMaxRequests();

                window = convertWindow(

                        custom
                                .getWindowValue(),

                        custom
                                .getWindowUnit()

                );

            }

        }

        /*
         * Sliding Window
         */

        long current = System.currentTimeMillis();

        clientRequestTimes
                .putIfAbsent(
                        clientId,
                        new LinkedList<>());

        Queue<Long> queue = clientRequestTimes
                .get(
                        clientId);

        synchronized (queue) {

            cleanupOldRequests(
                    queue,
                    current,
                    window);

            if (

            queue.size()

                    <

                    limit

            ) {

                queue.offer(
                        current);

                System.out.println(
                        "Allowed");

                return true;

            }

            System.out.println(
                    "Rate Limit Exceeded");

            return false;

        }

    }

    /*
     * Cleanup expired timestamps
     */

    private void cleanupOldRequests(

            Queue<Long> queue,

            long current,

            long window

    ) {

        while (

        !queue.isEmpty()

                &&

                queue.peek()

                        <=

                        current - window

        ) {

            queue.poll();

        }

    }

    /*
     * Convert window
     */

    private long convertWindow(

            int value,

            String unit

    ) {

        switch (unit) {

            case "SECOND":

                return value
                        *
                        1000L;

            case "MINUTE":

                return value
                        *
                        60
                        *
                        1000L;

            case "HOUR":

                return value
                        *
                        60
                        *
                        60
                        *
                        1000L;

            default:

                throw new RuntimeException(
                        "Invalid Window");

        }

    }

}