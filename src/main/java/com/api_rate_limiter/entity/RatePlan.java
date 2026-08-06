package com.api_rate_limiter.entity;

import jakarta.persistence.*;

import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor

public class RatePlan {

@Id
@GeneratedValue(strategy =GenerationType.IDENTITY)
    private Long id;

@Column(unique = true)
    private String planName;
    private Boolean active;
    private Integer price;
    private String description;
}