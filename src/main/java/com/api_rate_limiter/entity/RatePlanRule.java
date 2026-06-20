package com.api_rate_limiter.entity;

import jakarta.persistence.*;

import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor

public class RatePlanRule {

@Id
@GeneratedValue(
strategy =
GenerationType.IDENTITY
)
private Long id;

@OneToOne

@JoinColumn(
name="plan_id"
)

private RatePlan plan;

private Integer maxRequests;

private Integer windowValue;

private String windowUnit;

}