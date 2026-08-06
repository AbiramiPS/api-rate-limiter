package com.api_rate_limiter.entity;

import jakarta.persistence.*;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
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
private BigDecimal price;

private Boolean active;

private LocalDateTime createdAt;

private LocalDateTime updatedAt;
}