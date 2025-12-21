package com.example.nutrition.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeeklyNutritionReport {
    private LocalDate startDate;
    private LocalDate endDate;
    private List<DailyNutritionReport> dailyReports;
    private NutritionSummary weeklyAverage;
    private NutritionSummary weeklyTotal;
}

