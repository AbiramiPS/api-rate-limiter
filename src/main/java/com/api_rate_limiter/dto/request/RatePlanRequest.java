package com.api_rate_limiter.dto.request;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RatePlanRequest {
    @NotBlank(message = "Plan name is required")
    private String planName;

    @NotNull(message = "Active is required")
    private Boolean active;

    @Positive(message = "Price must be greater than 0")
    private Integer price;
    private String description;
}
