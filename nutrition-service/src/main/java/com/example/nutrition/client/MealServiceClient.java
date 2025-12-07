package com.example.nutrition.client;

import com.example.nutrition.dto.MealResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

import java.time.LocalDate;
import java.util.List;

@FeignClient(name = "meal-service")
public interface MealServiceClient {

    @GetMapping("/api/meals/date/{date}")
    List<MealResponse> getMealsByDate(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date);
}

