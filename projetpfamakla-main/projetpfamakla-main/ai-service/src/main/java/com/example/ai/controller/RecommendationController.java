package com.example.ai.controller;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recommend")
@CrossOrigin("*")
public class RecommendationController {

    private final com.example.ai.service.RecommendationService recommendationService;

    public RecommendationController(com.example.ai.service.RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @PostMapping
    public String recommend(@RequestBody Map<String, Object> userPreferences) {
        String prefs = userPreferences.toString();
        // Returns JSON string directly from AI
        return recommendationService.getRecommendations(prefs);
    }
}
