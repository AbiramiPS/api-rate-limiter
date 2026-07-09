package com.api_rate_limiter.entity;

import jakarta.persistence.*;

import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor

public class UserCustomRule {

@Id
@GeneratedValue(strategy =GenerationType.IDENTITY)
    private Long id;

@OneToOne

@JoinColumn(name="user_plan_id")
private UserPlan user;

private Integer maxRequests;
private Integer windowValue;
private String windowUnit;

}