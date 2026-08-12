package com.api_rate_limiter.service;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.api_rate_limiter.dto.request.UserCustomRuleRequest;
import com.api_rate_limiter.dto.response.UserCustomRuleResponse;
import com.api_rate_limiter.entity.UserCustomRule;
import com.api_rate_limiter.entity.UserPlan;
import com.api_rate_limiter.exception.ResourceNotFoundException;
import com.api_rate_limiter.mapper.UserCustomRuleMapper;
import com.api_rate_limiter.repository.UserCustomRuleRepository;
import com.api_rate_limiter.repository.UserPlanRepository;

@Service
public class UserCustomRuleService {

    @Autowired
    private UserCustomRuleRepository repo;

    @Autowired
    private UserPlanRepository userRepo;

    @Autowired
    private UserCustomRuleMapper mapper;

    /*
     * Redis service
     * Used to invalidate cached rate-limit rules
     */
    @Autowired
    private RedisService redisService;

    /*
     * =========================================================
     * GET CUSTOM RULE
     * =========================================================
     */

    public UserCustomRuleResponse getRule(Long userPlanId) {

        UserPlan user = userRepo.findById(userPlanId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        UserCustomRule rule = repo.findByUser(user);

        if (rule == null) {
            throw new ResourceNotFoundException(
                    "Custom rule not found");
        }

        return mapper.toResponse(rule);
    }

    /*
     * =========================================================
     * CREATE CUSTOM RULE
     * =========================================================
     */

    public UserCustomRuleResponse saveRule(
            UserCustomRuleRequest request) {

        UserPlan user = userRepo.findById(
                request.getUserPlanId()).orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Only Enterprise users can have custom rules
        if (!user.getPlan()
                .getPlanName()
                .equalsIgnoreCase("ENTERPRISE")) {

            throw new IllegalArgumentException(
                    "Custom rules are allowed only for Enterprise users.");
        }

        UserCustomRule rule = mapper.toEntity(request);

        rule.setUser(user);

        rule.setCreatedAt(
                LocalDateTime.now());

        rule.setUpdatedAt(
                LocalDateTime.now());

        UserCustomRule saved = repo.save(rule);

        /*
         * Enable custom rule for this user
         */
        user.setCustomRuleEnabled(true);

        userRepo.save(user);

        /*
         * IMPORTANT:
         *
         * If an old cached rule exists,
         * remove it.
         *
         * The next request will load
         * the newly created custom rule
         * and cache it again.
         */
        redisService.deleteCachedRule(
                user.getClientId());

        return mapper.toResponse(saved);
    }

    /*
     * =========================================================
     * SEARCH
     * =========================================================
     */

    public Page<UserCustomRuleResponse> searchUsers(
            String clientName,
            Pageable pageable) {

        return repo
                .findByUser_ClientNameContainingIgnoreCase(
                        clientName,
                        pageable)
                .map(mapper::toResponse);
    }

    /*
     * =========================================================
     * DELETE CUSTOM RULE
     * =========================================================
     */

    public void deleteRule(String clientId) {

        /*
         * Find user
         */
        UserPlan user = userRepo.findByClientId(clientId);

        if (user == null) {
            throw new ResourceNotFoundException(
                    "User not found");
        }

        /*
         * Only Enterprise users can have
         * custom rules
         */
        if (!user.getPlan()
                .getPlanName()
                .equalsIgnoreCase("ENTERPRISE")) {

            throw new IllegalArgumentException(
                    "Only Enterprise users can have custom rules.");
        }

        /*
         * Find custom rule
         */
        UserCustomRule rule = repo.findByUser(user);

        if (rule == null) {
            throw new ResourceNotFoundException(
                    "Custom rule not found");
        }

        /*
         * Delete custom rule from DB
         */
        repo.delete(rule);

        /*
         * Disable custom rule
         *
         * After this:
         *
         * customRuleEnabled = false
         *
         * Therefore RedisRuleResolverService
         * will use the default Enterprise rule.
         */
        user.setCustomRuleEnabled(false);

        userRepo.save(user);

        /*
         * IMPORTANT:
         *
         * Delete cached rule.
         *
         * Otherwise Redis could still contain
         * the deleted custom rule.
         */
        redisService.deleteCachedRule(
                clientId);
    }

    /*
     * =========================================================
     * UPDATE CUSTOM RULE
     * =========================================================
     */

    public UserCustomRuleResponse updateRule(
            String clientId,
            UserCustomRuleRequest request) {

        /*
         * Find user
         */
        UserPlan user = userRepo.findByClientId(clientId);

        if (user == null) {
            throw new ResourceNotFoundException(
                    "User not found");
        }

        /*
         * Only Enterprise users can have
         * custom rules
         */
        if (!user.getPlan()
                .getPlanName()
                .equalsIgnoreCase("ENTERPRISE")) {

            throw new IllegalArgumentException(
                    "Custom rules are allowed only for Enterprise users.");
        }

        /*
         * Find existing custom rule
         */
        UserCustomRule rule = repo.findByUser(user);

        if (rule == null) {
            throw new ResourceNotFoundException(
                    "Custom rule not found");
        }

        /*
         * Update custom rule
         */
        rule.setPrice(
                request.getPrice());

        rule.setMaxRequests(
                request.getMaxRequests());

        rule.setWindowValue(
                request.getWindowValue());

        rule.setWindowUnit(
                request.getWindowUnit());

        rule.setActive(
                request.getActive());

        rule.setUpdatedAt(
                LocalDateTime.now());

        /*
         * Make sure custom rule is enabled
         */
        user.setCustomRuleEnabled(true);

        userRepo.save(user);

        /*
         * Save updated rule
         */
        UserCustomRule updated = repo.save(rule);

        /*
         * IMPORTANT:
         *
         * Remove old cached rule.
         *
         * Example:
         *
         * Redis:
         * 5 requests / minute
         *
         * DB updated to:
         * 10 requests / minute
         *
         * Delete cache so next request
         * gets 10 requests / minute.
         */
        redisService.deleteCachedRule(
                clientId);

        return mapper.toResponse(updated);
    }

    /*
     * =========================================================
     * GET ENTITY
     * Used by RedisRuleResolverService
     * =========================================================
     */

    public UserCustomRule getRuleEntity(
            UserPlan user) {

        UserCustomRule rule = repo.findByUser(user);

        if (rule == null) {
            throw new ResourceNotFoundException(
                    "Custom rule not found");
        }

        return rule;
    }
}