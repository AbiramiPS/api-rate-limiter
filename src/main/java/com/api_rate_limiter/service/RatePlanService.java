package com.api_rate_limiter.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.api_rate_limiter.dto.request.RatePlanRequest;
import com.api_rate_limiter.dto.response.RatePlanResponse;
import com.api_rate_limiter.entity.RatePlan;
import com.api_rate_limiter.mapper.RatePlanMapper;
import com.api_rate_limiter.repository.RatePlanRepository;
import org.springframework.data.domain.Pageable;
@Service
public class RatePlanService {

        @Autowired
        private RatePlanRepository repository;

        @Autowired
        private RatePlanMapper mapper;

        public RatePlanResponse savePlan(RatePlanRequest request) {
                RatePlan plan = mapper.toEntity(request);
                RatePlan saved = repository.save(plan);
                return mapper.toResponse(saved);
        }

        public RatePlanResponse getPlan(String planName) {
                RatePlan plan = repository.findByPlanName(planName).orElseThrow(() -> new RuntimeException("Plan not found"));
                return mapper.toResponse(plan);
        }

        public List<RatePlanResponse> getAll(Pageable pageable) {
                return repository.findAll(pageable).stream().map(mapper::toResponse).collect(Collectors.toList());
        }
}