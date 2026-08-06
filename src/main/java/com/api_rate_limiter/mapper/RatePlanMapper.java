package com.api_rate_limiter.mapper;

import org.mapstruct.Mapper;

import com.api_rate_limiter.dto.request.RatePlanRequest;
import com.api_rate_limiter.dto.response.RatePlanResponse;
import com.api_rate_limiter.entity.RatePlan;
@Mapper(componentModel = "spring")
public interface RatePlanMapper {

    RatePlan toEntity(RatePlanRequest request);
    RatePlanResponse toResponse(RatePlan entity);
}
