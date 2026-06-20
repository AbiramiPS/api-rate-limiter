package com.api_rate_limiter.service;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Queue;
import java.util.LinkedList;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;

import com.api_rate_limiter.entity.*;

import com.api_rate_limiter.repository.*;

@Service
public class RateLimiterService {

    private final Map<String, Queue<Long>> clientRequestTimes = new ConcurrentHashMap<>();

    @Autowired
    private UserPlanRepository userRepo;

    @Autowired
    private RatePlanRuleRepository ruleRepo;

    @Autowired
    private UserCustomRuleRepository customRepo;

    public boolean isRequestAllowed(
            String clientId) {

        UserPlan user = userRepo
                .findByClientId(
                        clientId);

        if (user == null) {

            return false;

        }

        /*
         * Get default rule
         */

        RatePlanRule rule = ruleRepo
                .findByPlan(
                        user.getPlan());

        int limit = rule
                .getMaxRequests();

        long window = convertWindow(
                rule.getWindowValue(),
                rule.getWindowUnit());

        /*
         * Override for enterprise
         */

        UserCustomRule custom = customRepo
                .findByUser(
                        user);

        if (custom != null) {

            limit = custom
                    .getMaxRequests();

            window = convertWindow(
                    custom.getWindowValue(),
                    custom.getWindowUnit());

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

            while (

            !queue.isEmpty()

                    &&

                    queue.peek()

                            <=

                            current - window

            ) {

                queue.poll();

            }

            if (

            queue.size()

                    <

                    limit

            ) {

                queue.offer(
                        current);

                return true;

            }

            return false;

        }

    }

    /*
     * Window conversion
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