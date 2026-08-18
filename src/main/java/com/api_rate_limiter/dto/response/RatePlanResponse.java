package com.api_rate_limiter.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class RatePlanResponse {
    private Long id;
    private String planName;
    private Boolean active;
    private Integer maxRequests;
    private Integer windowValue;
    private String windowUnit;
}
