package com.api_rate_limiter.dto.response;
 import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.validation.constraints.Positive;
 import lombok.Data;
@Data
public class UserCustomRuleResponse {

    private Long id;
    private String clientId;
    private String clientName;
    private Integer maxRequests;
    private Integer windowValue;
    private String windowUnit;
    private BigDecimal price;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
