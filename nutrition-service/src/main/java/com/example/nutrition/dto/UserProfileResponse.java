package com.example.nutrition.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private Long id;
    private Double calorieGoal;
    private Double proteinGoal;
    private Double carbsGoal;
    private Double fatGoal;
    private String activityLevel;
    private String goal;
}

