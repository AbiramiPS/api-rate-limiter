package com.api_rate_limiter.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.api_rate_limiter.dto.request.UserCustomRuleRequest;
import com.api_rate_limiter.dto.response.UserCustomRuleResponse;
import com.api_rate_limiter.entity.UserCustomRule;

@Mapper(componentModel = "spring")
public interface UserCustomRuleMapper {

    @Mapping(target = "user", ignore = true)
    UserCustomRule toEntity(UserCustomRuleRequest request);

    @Mapping(source = "user.clientId", target = "clientId")
    @Mapping(source = "user.clientName", target = "clientName")
    UserCustomRuleResponse toResponse(UserCustomRule entity);
}
