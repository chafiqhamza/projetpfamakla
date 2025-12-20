package com.example.ai.controller;

import com.example.ai.service.EnhancedNutritionAgentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/enhanced")
@CrossOrigin(origins = "*")
public class EnhancedAgentController {

    private static final Logger log = LoggerFactory.getLogger(EnhancedAgentController.class);

    private final EnhancedNutritionAgentService agentService;

    public EnhancedAgentController(
            EnhancedNutritionAgentService agentService
    ) {
        this.agentService = agentService;
    }

    /**
     * Ultra-fast quick analysis endpoint - optimized for speed
     */
    @PostMapping("/quick-analyze")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> quickAnalyze(
            @RequestBody Map<String, Object> request) {

        String userData = (String) request.getOrDefault("userData", "");
        boolean isDiabetic = (boolean) request.getOrDefault("isDiabetic", false);

        // If frontend provided a structured userProfile, merge it into userData JSON so agent gets full context
        try {
            Object userProfileObj = request.get("userProfile");
            if (userProfileObj != null) {
                ObjectMapper mapper = new ObjectMapper();
                Map<String, Object> baseData = new HashMap<>();
                if (userData != null && !userData.isEmpty()) {
                    try {
                        baseData = mapper.readValue(userData, new TypeReference<Map<String, Object>>(){});
                    } catch (Exception e) {
                        // ignore, keep baseData empty
                    }
                }

                // Merge userProfile into baseData
                if (userProfileObj instanceof Map) {
                    baseData.putAll((Map<String, Object>) userProfileObj);
                } else {
                    // Try to parse stringified JSON profile
                    try {
                        Map<String, Object> profileMap = mapper.convertValue(userProfileObj, new TypeReference<Map<String, Object>>(){});
                        baseData.putAll(profileMap);
                    } catch (Exception ex) {
                        log.warn("Unable to parse userProfile from request", ex);
                    }
                }

                userData = mapper.writeValueAsString(baseData);
            }
        } catch (Exception e) {
            log.warn("Failed merging userProfile into userData", e);
        }

        return agentService.quickAnalyze(userData, isDiabetic)
                .thenApply(ResponseEntity::ok);
    }

    /**
     * Intelligent meal logging with automatic nutrition estimation
     */
    @PostMapping("/smart-meal-log")
    public ResponseEntity<Map<String, Object>> smartMealLog(
            @RequestBody Map<String, Object> request) {

        String mealDescription = (String) request.getOrDefault("description", "");
        boolean isDiabetic = (boolean) request.getOrDefault("isDiabetic", false);
        Object userProfileObj = request.get("userProfile");
        Map<String, Object> userProfile = null;
        if (userProfileObj instanceof Map) {
            userProfile = (Map<String, Object>) userProfileObj;
        }

        Map<String, Object> result = agentService.intelligentMealLog(mealDescription, isDiabetic, userProfile);
        return ResponseEntity.ok(result);
    }

    /**
     * Real-time diabetic monitoring
     */
    @PostMapping("/diabetic-monitor")
    public ResponseEntity<Map<String, Object>> diabeticMonitor(
            @RequestBody Map<String, Object> request) {

        String todayData = (String) request.getOrDefault("todayData", "");
        int totalCarbs = ((Number) request.getOrDefault("totalCarbs", 0)).intValue();
        int glucoseLevel = ((Number) request.getOrDefault("glucoseLevel", 0)).intValue();

        Map<String, Object> result = agentService.diabeticMonitoring(todayData, totalCarbs, glucoseLevel);
        return ResponseEntity.ok(result);
    }

    /**
     * Get diabetic-friendly meal suggestions
     */
    @GetMapping("/diabetic-meals")
    public ResponseEntity<Map<String, Object>> getDiabeticMeals(
            @RequestParam(defaultValue = "50") int remainingCarbs) {

        Map<String, Object> result = agentService.diabeticMealSuggestions(remainingCarbs);
        return ResponseEntity.ok(result);
    }

    /**
     * Weekly trends analysis
     */
    @PostMapping("/weekly-trends")
    public ResponseEntity<Map<String, Object>> weeklyTrends(
            @RequestBody Map<String, Object> request) {

        String weekData = (String) request.getOrDefault("weekData", "");
        boolean isDiabetic = (boolean) request.getOrDefault("isDiabetic", false);

        Map<String, Object> result = agentService.generateWeeklyTrends(weekData, isDiabetic);
        return ResponseEntity.ok(result);
    }

    /**
     * Food recognition from image/barcode
     */
    @PostMapping("/recognize-food")
    public ResponseEntity<Map<String, Object>> recognizeFood(
            @RequestBody Map<String, Object> request) {

        String imageDescription = (String) request.getOrDefault("description", "");

        Map<String, Object> result = agentService.recognizeFood(imageDescription);
        return ResponseEntity.ok(result);
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health-check")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "healthy");
        response.put("timestamp", java.time.LocalDateTime.now().toString());
        response.put("service", "Enhanced AI Nutrition Agent");
        response.put("version", "2.0");
        return ResponseEntity.ok(response);
    }

    /**
     * Get personalized water intake recommendations
     */
    @PostMapping("/water-recommendations")
    public ResponseEntity<Map<String, Object>> getWaterRecommendations(
            @RequestBody Map<String, Object> request) {

        String userData = (String) request.getOrDefault("userData", "");
        String activityLevel = (String) request.getOrDefault("activityLevel", "moderate");
        int currentWater = ((Number) request.getOrDefault("currentWater", 0)).intValue();

        Map<String, Object> result = agentService.calculateWaterRecommendations(userData, activityLevel, currentWater);
        return ResponseEntity.ok(result);
    }

    /**
     * Generate contextual nutrition insights
     */
    @PostMapping("/nutrition-insights")
    public ResponseEntity<Map<String, Object>> getNutritionInsights(
            @RequestBody Map<String, Object> request) {

        String userData = (String) request.getOrDefault("userData", "");
        boolean isDiabetic = (boolean) request.getOrDefault("isDiabetic", false);

        Map<String, Object> result = agentService.generateNutritionInsights(userData, isDiabetic);
        return ResponseEntity.ok(result);
    }

    /**
     * Generate automatic agent actions based on user data (auto-act)
     */
    @PostMapping("/auto-act")
    public ResponseEntity<Map<String, Object>> autoAct(@RequestBody Map<String, Object> request) {
        try {
            Map<String, Object> userData = (Map<String, Object>) request.getOrDefault("userData", new HashMap<String, Object>());
            boolean isDiabetic = (boolean) request.getOrDefault("isDiabetic", false);
            Map<String, Object> actions = agentService.autoAct(userData, isDiabetic);
            return ResponseEntity.ok(actions);
        } catch (Exception e) {
            log.error("auto-act failed", e);
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "auto-act failed on server");
            return ResponseEntity.status(500).body(err);
        }
    }

    /**
     * DEBUG: return last parsed userData received by quickAnalyze
     */
    @GetMapping("/debug/last-userdata")
    public ResponseEntity<Map<String, Object>> getLastUserData() {
        try {
            Map<String, Object> last = agentService.getLastReceivedUserData();
            return ResponseEntity.ok(last);
        } catch (Exception e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "failed to get last user data");
            return ResponseEntity.status(500).body(err);
        }
    }
}
