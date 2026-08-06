package com.api_rate_limiter.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import com.api_rate_limiter.entity.RatePlanRule;
import com.api_rate_limiter.dto.request.RatePlanRuleRequest;
import com.api_rate_limiter.dto.response.RatePlanRuleResponse;
@Mapper(componentModel = "spring")
public interface RatePlanRuleMapper {

    @Mapping(target = "plan", ignore = true)
    RatePlanRule toEntity(RatePlanRuleRequest request);

    @Mapping(source = "plan.planName", target = "planName")
    RatePlanRuleResponse toResponse(RatePlanRule entity);
}