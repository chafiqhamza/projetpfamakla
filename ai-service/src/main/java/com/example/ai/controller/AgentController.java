package com.example.ai.controller;

import com.example.ai.service.NutritionAgentService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller for the Intelligent Nutrition Agent
 * Provides endpoints for proactive AI assistance and automated app interactions
 */
@RestController
@RequestMapping("/api/agent")
@CrossOrigin("*")
public class AgentController {

    private final NutritionAgentService agentService;

    public AgentController(
            NutritionAgentService agentService
    ) {
        this.agentService = agentService;
    }

    /**
     * Main agent endpoint - analyzes user data and returns proactive recommendations with actions
     */
    @PostMapping("/analyze")
    public Map<String, Object> analyzeAndAct(@RequestBody Map<String, Object> request) {
        String userData = request.get("userData") != null ? request.get("userData").toString() : null;
        String userProfile = request.get("userProfile") != null ? request.get("userProfile").toString() : null;

        return agentService.analyzeAndAct(userData, userProfile);
    }

    /**
     * Get personalized meal suggestions
     */
    @PostMapping("/suggest-meals")
    public Map<String, Object> suggestMeals(@RequestBody Map<String, Object> request) {
        String userProfile = request.get("userProfile") != null ? request.get("userProfile").toString() : null;
        String mealType = request.get("mealType") != null ? request.get("mealType").toString() : null;
        String restrictions = request.get("restrictions") != null ? request.get("restrictions").toString() : null;

        return agentService.suggestMeals(userProfile, mealType, restrictions);
    }

    /**
     * Generate AI-powered statistics and insights
     */
    @PostMapping("/statistics")
    public Map<String, Object> generateStatistics(@RequestBody Map<String, Object> request) {
        String mealsData = request.get("mealsData") != null ? request.get("mealsData").toString() : null;
        String waterData = request.get("waterData") != null ? request.get("waterData").toString() : null;
        String period = request.get("period") != null ? request.get("period").toString() : "today";

        return agentService.generateStatistics(mealsData, waterData, period);
    }

    /**
     * Process natural language commands for app control
     */
    @PostMapping("/command")
    public Map<String, Object> processCommand(@RequestBody Map<String, Object> request) {
        String command = request.get("command") != null ? request.get("command").toString() : "";
        String context = request.get("context") != null ? request.get("context").toString() : null;

        return agentService.processCommand(command, context);
    }

    /**
     * Check for health alerts based on user patterns
     */
    @PostMapping("/health-check")
    public Map<String, Object> checkHealthAlerts(@RequestBody Map<String, Object> request) {
        String userData = request.get("userData") != null ? request.get("userData").toString() : "";

        return agentService.checkHealthAlerts(userData);
    }
}

