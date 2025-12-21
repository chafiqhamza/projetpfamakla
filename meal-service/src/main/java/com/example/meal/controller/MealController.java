package com.example.meal.controller;

import com.example.meal.dto.MealRequest;
import com.example.meal.model.Meal;
import com.example.meal.service.MealService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/meals")
public class MealController {

    private final MealService mealService;

    public MealController(MealService mealService) {
        this.mealService = mealService;
    }

    @GetMapping
    public ResponseEntity<List<Meal>> getAllMeals() {
        return ResponseEntity.ok(mealService.getAllMeals());
    }

    @PostMapping
    public ResponseEntity<Meal> createMeal(@RequestBody MealRequest request) {
        return ResponseEntity.ok(mealService.createMeal(request));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Meal>> getUserMeals(@PathVariable Long userId) {
        return ResponseEntity.ok(mealService.getUserMeals(userId));
    }

    @GetMapping("/user/{userId}/date/{date}")
    public ResponseEntity<List<Meal>> getMealsByUserAndDate(
            @PathVariable Long userId,
            @PathVariable LocalDate date) {
        return ResponseEntity.ok(mealService.getMealsByUserAndDate(userId, date));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Meal> getMealById(@PathVariable Long id) {
        return ResponseEntity.ok(mealService.getMealById(id));
    }

    // OPÉRATIONS COMPLEXES AJOUTÉES

    @GetMapping("/statistics/user/{userId}")
    public ResponseEntity<?> getUserMealStatistics(@PathVariable Long userId) {
        return ResponseEntity.ok(mealService.getUserMealStatistics(userId));
    }

    @GetMapping("/statistics/user/{userId}/period")
    public ResponseEntity<?> getUserMealStatisticsByPeriod(
            @PathVariable Long userId,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        return ResponseEntity.ok(mealService.getUserMealStatisticsByPeriod(userId, startDate, endDate));
    }

    @GetMapping("/calories/user/{userId}/daily")
    public ResponseEntity<?> getDailyCalories(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(mealService.getDailyCaloriesForLastDays(userId, days));
    }

    @GetMapping("/macros/user/{userId}/average")
    public ResponseEntity<?> getAverageMacros(@PathVariable Long userId) {
        return ResponseEntity.ok(mealService.getAverageMacros(userId));
    }

    @GetMapping("/frequent/user/{userId}")
    public ResponseEntity<?> getMostFrequentMealTypes(@PathVariable Long userId) {
        return ResponseEntity.ok(mealService.getMostFrequentMealTypes(userId));
    }

    @GetMapping("/today")
    public ResponseEntity<List<Meal>> getTodayMeals() {
        // Pour démo, utiliser userId = 1
        return ResponseEntity.ok(mealService.getMealsByUserAndDate(1L, LocalDate.now()));
    }

    @GetMapping("/comparison/user/{userId}")
    public ResponseEntity<?> getWeeklyComparison(@PathVariable Long userId) {
        return ResponseEntity.ok(mealService.getWeeklyComparison(userId));
    }

    @GetMapping("/trends/user/{userId}")
    public ResponseEntity<?> getNutritionTrends(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(mealService.getNutritionTrends(userId, days));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Meal> updateMeal(
            @PathVariable Long id,
            @RequestBody MealRequest request) {
        return ResponseEntity.ok(mealService.updateMeal(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMeal(@PathVariable Long id) {
        mealService.deleteMeal(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Meal Service is running");
    }
}

