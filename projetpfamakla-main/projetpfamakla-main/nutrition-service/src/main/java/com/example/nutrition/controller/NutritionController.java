package com.example.nutrition.controller;

import com.example.nutrition.dto.DailyNutritionReport;
import com.example.nutrition.dto.WeeklyNutritionReport;
import com.example.nutrition.service.NutritionAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/nutrition")
@RequiredArgsConstructor
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class NutritionController {

    private final NutritionAnalysisService nutritionAnalysisService;

    @GetMapping("/report/daily")
    public ResponseEntity<DailyNutritionReport> getDailyReport(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate reportDate = date != null ? date : LocalDate.now();
        return ResponseEntity.ok(nutritionAnalysisService.getDailyReport(userId, reportDate));
    }

    @GetMapping("/report/weekly")
    public ResponseEntity<WeeklyNutritionReport> getWeeklyReport(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate) {
        LocalDate weekStart = startDate != null ? startDate : LocalDate.now().minusDays(6);
        return ResponseEntity.ok(nutritionAnalysisService.getWeeklyReport(userId, weekStart));
    }
}

