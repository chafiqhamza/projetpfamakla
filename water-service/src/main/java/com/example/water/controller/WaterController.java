package com.example.water.controller;

import com.example.water.dto.WaterGoalRequest;
import com.example.water.dto.WaterIntakeRequest;
import com.example.water.dto.WaterSummaryResponse;
import com.example.water.model.WaterGoal;
import com.example.water.model.WaterIntake;
import com.example.water.service.WaterService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/water")
public class WaterController {

    private final WaterService waterService;

    // Constructor manuel pour injection de dépendances
    public WaterController(WaterService waterService) {
        this.waterService = waterService;
    }

    @PostMapping("/intake")
    public ResponseEntity<WaterIntake> addWaterIntake(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody WaterIntakeRequest request) {
        WaterIntake intake = waterService.addWaterIntake(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(intake);
    }

    @GetMapping("/intake")
    public ResponseEntity<List<WaterIntake>> getUserWaterIntake(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(waterService.getUserWaterIntake(userId));
    }

    @GetMapping("/intake/date/{date}")
    public ResponseEntity<List<WaterIntake>> getUserWaterIntakeForDate(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(waterService.getUserWaterIntakeForDate(userId, date));
    }

    @GetMapping("/summary/today")
    public ResponseEntity<WaterSummaryResponse> getTodaySummary(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(waterService.getDailySummary(userId, LocalDate.now()));
    }

    @GetMapping("/summary/date/{date}")
    public ResponseEntity<WaterSummaryResponse> getSummaryForDate(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(waterService.getDailySummary(userId, date));
    }

    @PostMapping("/goal")
    public ResponseEntity<WaterGoal> setWaterGoal(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody WaterGoalRequest request) {
        WaterGoal goal = waterService.setWaterGoal(userId, request);
        return ResponseEntity.ok(goal);
    }

    @GetMapping("/goal")
    public ResponseEntity<WaterGoal> getUserGoal(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(waterService.getUserGoal(userId));
    }

    @DeleteMapping("/intake/{id}")
    public ResponseEntity<Void> deleteWaterIntake(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long id) {
        waterService.deleteWaterIntake(id, userId);
        return ResponseEntity.noContent().build();
    }

    // Simplified endpoints for frontend compatibility (without authentication)
    @GetMapping
    public ResponseEntity<List<WaterIntake>> getAllWaterIntakes() {
        // Using default user ID 1 for demo purposes
        return ResponseEntity.ok(waterService.getUserWaterIntake(1L));
    }

    @PostMapping
    public ResponseEntity<WaterIntake> addWater(@RequestBody WaterIntakeRequest request) {
        // Using default user ID 1 for demo purposes
        WaterIntake intake = waterService.addWaterIntake(1L, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(intake);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWater(@PathVariable Long id) {
        // Using default user ID 1 for demo purposes
        waterService.deleteWaterIntake(id, 1L);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/total/{date}")
    public ResponseEntity<Integer> getTotalForDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        // Using default user ID 1 for demo purposes
        WaterSummaryResponse summary = waterService.getDailySummary(1L, date);
        return ResponseEntity.ok(summary.getTotalMl());
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Water Service is running");
    }

    // OPÉRATIONS COMPLEXES AJOUTÉES

    @GetMapping("/statistics/user/{userId}")
    public ResponseEntity<?> getWaterStatistics(@PathVariable Long userId) {
        return ResponseEntity.ok(waterService.getWaterStatistics(userId));
    }

    @GetMapping("/statistics/weekly/{userId}")
    public ResponseEntity<?> getWeeklyStatistics(@PathVariable Long userId) {
        return ResponseEntity.ok(waterService.getWeeklyStatistics(userId));
    }

    @GetMapping("/statistics/monthly/{userId}")
    public ResponseEntity<?> getMonthlyStatistics(@PathVariable Long userId) {
        return ResponseEntity.ok(waterService.getMonthlyStatistics(userId));
    }

    @GetMapping("/trends/{userId}")
    public ResponseEntity<?> getHydrationTrends(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(waterService.getHydrationTrends(userId, days));
    }

    @GetMapping("/completion-rate/{userId}")
    public ResponseEntity<?> getGoalCompletionRate(@PathVariable Long userId) {
        return ResponseEntity.ok(waterService.getGoalCompletionRate(userId));
    }

    @GetMapping("/hourly-distribution/{userId}")
    public ResponseEntity<?> getHourlyDistribution(@PathVariable Long userId) {
        return ResponseEntity.ok(waterService.getHourlyDistribution(userId));
    }

    @GetMapping("/comparison/{userId}")
    public ResponseEntity<?> getWeeklyComparison(@PathVariable Long userId) {
        return ResponseEntity.ok(waterService.getWeeklyComparison(userId));
    }

    @GetMapping("/today")
    public ResponseEntity<?> getTodayIntake() {
        // Pour démo, utiliser userId = 1
        WaterSummaryResponse summary = waterService.getDailySummary(1L, LocalDate.now());
        List<WaterIntake> intakes = waterService.getUserWaterIntakeForDate(1L, LocalDate.now());
        return ResponseEntity.ok(java.util.Map.of(
            "totalAmount", summary.getTotalMl(),
            "goal", summary.getGoalMl(),
            "percentage", summary.getPercentageAchieved(),
            "intakes", intakes
        ));
    }

    @GetMapping("/streaks/{userId}")
    public ResponseEntity<?> getHydrationStreaks(@PathVariable Long userId) {
        return ResponseEntity.ok(waterService.getHydrationStreaks(userId));
    }

    @GetMapping("/best-days/{userId}")
    public ResponseEntity<?> getBestHydrationDays(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(waterService.getBestHydrationDays(userId, days));
    }
}

