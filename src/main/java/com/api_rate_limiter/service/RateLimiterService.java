package com.api_rate_limiter.service;

import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.Queue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.LinkedList;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimiterService {
    // This is a placeholder for the actual rate limiting logic.
    // In a real implementation, you would use a library like Bucket4j or implement your own logic to track requests and enforce limits.

    public final Map<String, Queue<Long>> clientRequestTimes = new ConcurrentHashMap<>();
    private final int MAX_REQUESTS_PER_MINUTE = 5;
    private final long WINDOW_SIZE = 60 * 1000; // 1 minute in milliseconds

    
    public boolean isRequestAllowed(String clientId) {
            long currentTime = System.currentTimeMillis();
            System.out.println("Current time: " + currentTime);
            clientRequestTimes.putIfAbsent(clientId, new LinkedList<>());
            Queue<Long> queue = clientRequestTimes.get(clientId);

            synchronized (queue) {
                while (!queue.isEmpty() && queue.peek() <= currentTime - WINDOW_SIZE) {
                    System.out.println("WINDOW_SIZE: " + WINDOW_SIZE);
                    System.out.println("Peeked time: " + queue.peek());
                    System.out.println("Current time - WINDOW_SIZE: " + (currentTime - WINDOW_SIZE));
                    System.out.println("Q " + queue);

                    queue.poll(); // Remove timestamps that are outside the time window
                }
                if (queue.size() < MAX_REQUESTS_PER_MINUTE) {
                    queue.offer(currentTime); // Add the current timestamp to the queue
                    return true; // Allow the request
                } else {
                    System.out.println("Peeked time: " + queue.peek());
                    System.out.println("Request denied for client: " + clientId);
                    return false; // Deny the request
                }
            }

    }
}
