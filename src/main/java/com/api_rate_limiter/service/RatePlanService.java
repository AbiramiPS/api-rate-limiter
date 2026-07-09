package com.api_rate_limiter.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.List;
import com.api_rate_limiter.entity.RatePlan;
import com.api_rate_limiter.repository.RatePlanRepository;

@Service
public class RatePlanService {
    @Autowired
    private RatePlanRepository repo;
    public RatePlan getPlan(String name) {
        return repo.findByPlanName(name);
    }

    public RatePlan savePlan(RatePlan plan) {
        return repo.save(plan);
    }

    public List<RatePlan> getAll() {
        return repo.findAll();
    }
}