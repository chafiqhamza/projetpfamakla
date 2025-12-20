package com.example.nutrition.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyNutritionReport {
    private LocalDate date;
    private NutritionSummary summary;
    private Double calorieGoal;
    private Double proteinGoal;
    private Double carbsGoal;
    private Double fatGoal;
    private Double caloriePercentage;
    private Double proteinPercentage;
    private Double carbsPercentage;
    private Double fatPercentage;
}

