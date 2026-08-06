package com.api_rate_limiter.dto.response;



import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Data
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class UserPlanResponse {

    private Long id;

    private String clientId;

    private String clientName;

    private String planName;

    private boolean customRuleEnabled;
}