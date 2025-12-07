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

