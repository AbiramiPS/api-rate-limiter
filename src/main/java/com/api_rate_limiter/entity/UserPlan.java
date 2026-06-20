package com.api_rate_limiter.entity;

import jakarta.persistence.*;

import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor

public class UserPlan {

@Id
@GeneratedValue(
strategy =
GenerationType.IDENTITY
)
private Long id;

@Column(
unique = true
)
private String clientId;

@ManyToOne

@JoinColumn(
name="plan_id"
)

private RatePlan plan;

}