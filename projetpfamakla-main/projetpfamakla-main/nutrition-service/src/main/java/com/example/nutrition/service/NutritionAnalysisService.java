package com.example.nutrition.service;

import com.example.nutrition.client.MealServiceClient;
import com.example.nutrition.client.UserServiceClient;
import com.example.nutrition.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NutritionAnalysisService {

    private final MealServiceClient mealServiceClient;
    private final UserServiceClient userServiceClient;

    public DailyNutritionReport getDailyReport(Long userId, LocalDate date) {
        List<MealResponse> meals = mealServiceClient.getMealsByDate(userId, date);
        UserProfileResponse profile = userServiceClient.getUserProfile(userId);

        NutritionSummary summary = calculateSummary(meals);

        return DailyNutritionReport.builder()
                .date(date)
                .summary(summary)
                .calorieGoal(profile.getCalorieGoal() != null ? profile.getCalorieGoal() : 2000.0)
                .proteinGoal(profile.getProteinGoal() != null ? profile.getProteinGoal() : 150.0)
                .carbsGoal(profile.getCarbsGoal() != null ? profile.getCarbsGoal() : 250.0)
                .fatGoal(profile.getFatGoal() != null ? profile.getFatGoal() : 70.0)
                .caloriePercentage(calculatePercentage(summary.getTotalCalories(), profile.getCalorieGoal(), 2000.0))
                .proteinPercentage(calculatePercentage(summary.getTotalProtein(), profile.getProteinGoal(), 150.0))
                .carbsPercentage(calculatePercentage(summary.getTotalCarbs(), profile.getCarbsGoal(), 250.0))
                .fatPercentage(calculatePercentage(summary.getTotalFat(), profile.getFatGoal(), 70.0))
                .build();
    }

    public WeeklyNutritionReport getWeeklyReport(Long userId, LocalDate startDate) {
        LocalDate endDate = startDate.plusDays(6);
        List<DailyNutritionReport> dailyReports = new ArrayList<>();

        double totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0, totalFiber = 0;
        int totalMeals = 0;

        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            DailyNutritionReport dailyReport = getDailyReport(userId, date);
            dailyReports.add(dailyReport);

            NutritionSummary summary = dailyReport.getSummary();
            totalCalories += summary.getTotalCalories();
            totalProtein += summary.getTotalProtein();
            totalCarbs += summary.getTotalCarbs();
            totalFat += summary.getTotalFat();
            totalFiber += summary.getTotalFiber();
            totalMeals += summary.getMealCount();
        }

        NutritionSummary weeklyTotal = NutritionSummary.builder()
                .totalCalories(totalCalories)
                .totalProtein(totalProtein)
                .totalCarbs(totalCarbs)
                .totalFat(totalFat)
                .totalFiber(totalFiber)
                .mealCount(totalMeals)
                .build();

        NutritionSummary weeklyAverage = NutritionSummary.builder()
                .totalCalories(totalCalories / 7)
                .totalProtein(totalProtein / 7)
                .totalCarbs(totalCarbs / 7)
                .totalFat(totalFat / 7)
                .totalFiber(totalFiber / 7)
                .mealCount(totalMeals / 7)
                .build();

        return WeeklyNutritionReport.builder()
                .startDate(startDate)
                .endDate(endDate)
                .dailyReports(dailyReports)
                .weeklyTotal(weeklyTotal)
                .weeklyAverage(weeklyAverage)
                .build();
    }

    private NutritionSummary calculateSummary(List<MealResponse> meals) {
        double totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0, totalFiber = 0;

        for (MealResponse meal : meals) {
            totalCalories += meal.getCalories() != null ? meal.getCalories() : 0;
            totalProtein += meal.getProtein() != null ? meal.getProtein() : 0;
            totalCarbs += meal.getCarbs() != null ? meal.getCarbs() : 0;
            totalFat += meal.getFat() != null ? meal.getFat() : 0;
            totalFiber += meal.getFiber() != null ? meal.getFiber() : 0;
        }

        return NutritionSummary.builder()
                .totalCalories(totalCalories)
                .totalProtein(totalProtein)
                .totalCarbs(totalCarbs)
                .totalFat(totalFat)
                .totalFiber(totalFiber)
                .mealCount(meals.size())
                .build();
    }

    private Double calculatePercentage(Double actual, Double goal, Double defaultGoal) {
        double targetGoal = goal != null ? goal : defaultGoal;
        return (actual / targetGoal) * 100.0;
    }
}

