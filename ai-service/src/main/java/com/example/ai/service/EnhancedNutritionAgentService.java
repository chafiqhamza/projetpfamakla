package com.example.ai.service;

import dev.langchain4j.model.chat.ChatLanguageModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Async;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.beans.factory.annotation.Autowired;
import com.example.ai.service.RagChatService;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.CompletableFuture;

/**
 * Enhanced AI Agent with intelligent water calculations, meal analysis, and contextual recommendations
 */
@Service
public class EnhancedNutritionAgentService {


    private static final Logger log = LoggerFactory.getLogger(EnhancedNutritionAgentService.class);
    private final ChatLanguageModel chatLanguageModel;
    private final RagChatService ragChatService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<String, Object> responseCache = new HashMap<>();
    // For debugging: store last received userData (merged) so controller can expose it
    private volatile Map<String, Object> lastReceivedUserData = new HashMap<>();


    public EnhancedNutritionAgentService(
            ChatLanguageModel chatLanguageModel
            , RagChatService ragChatService
    ) {
        this.chatLanguageModel = chatLanguageModel;
        this.ragChatService = ragChatService;
    }
    // Nutrition databases for intelligent recommendations
    private static final Map<String, Integer> WATER_NEEDS_BY_ACTIVITY = Map.of(
        "sedentary", 2000,
        "light", 2300,
        "moderate", 2800,
        "active", 3200,
        "very_active", 3800
    );

    private static final Map<String, Map<String, Double>> FOOD_NUTRITION_DB = Map.of(
        "grilled chicken breast", Map.of("calories", 165.0, "protein", 31.0, "carbs", 0.0, "fats", 3.6, "iron", 0.9),
        "salmon fillet", Map.of("calories", 206.0, "protein", 22.0, "carbs", 0.0, "fats", 12.0, "iron", 0.8),
        "quinoa cooked", Map.of("calories", 222.0, "protein", 8.0, "carbs", 39.0, "fats", 3.6, "iron", 2.8),
        "spinach fresh", Map.of("calories", 23.0, "protein", 2.9, "carbs", 3.6, "fats", 0.4, "iron", 2.7),
        "lentils cooked", Map.of("calories", 230.0, "protein", 18.0, "carbs", 40.0, "fats", 0.8, "iron", 6.6),
        "greek yogurt", Map.of("calories", 100.0, "protein", 17.0, "carbs", 6.0, "fats", 0.4, "iron", 0.1),
        "almonds", Map.of("calories", 579.0, "protein", 21.0, "carbs", 22.0, "fats", 50.0, "iron", 3.7),
        "dark chocolate", Map.of("calories", 546.0, "protein", 7.8, "carbs", 45.0, "fats", 31.0, "iron", 11.9),
        "beef lean", Map.of("calories", 250.0, "protein", 26.0, "carbs", 0.0, "fats", 15.0, "iron", 2.9),
        "broccoli", Map.of("calories", 34.0, "protein", 2.8, "carbs", 7.0, "fats", 0.4, "iron", 0.7)
    );

    /**
     * Enhanced quick analysis with intelligent water and nutrition insights
     */
    @Async
    public CompletableFuture<Map<String, Object>> quickAnalyze(String userData, boolean isDiabetic) {
        return CompletableFuture.supplyAsync(() -> {
            Map<String, Object> result = new HashMap<>();

            try {
                // Parse user data
                Map<String, Object> data = parseUserData(userData);
                // Save parsed data for debugging/inspection
                if (data != null) {
                    lastReceivedUserData = new HashMap<>(data);
                }

                // Calculate intelligent insights
                int healthScore = calculateHealthScore(data, isDiabetic);
                String topAlert = generateTopAlert(data, isDiabetic);
                String quickTip = generateQuickTip(data, isDiabetic);

                // Water intake recommendations
                int recommendedWater = calculateWaterNeeds(data);
                int currentWater = ((Number) data.getOrDefault("water", 0)).intValue();
                int waterDeficit = Math.max(0, recommendedWater - currentWater);

                result.put("healthScore", healthScore);
                result.put("topAlert", topAlert);
                result.put("quickTip", quickTip);
                result.put("recommendedWater", recommendedWater);
                result.put("waterDeficit", waterDeficit);
                result.put("success", true);

                if (isDiabetic) {
                    String carbsWarning = generateCarbsWarning(data);
                    if (carbsWarning != null) {
                        result.put("carbsWarning", carbsWarning);
                    }
                }

                // Add contextual recommendations
                result.put("recommendations", generateContextualRecommendations(data, isDiabetic));

                // --- Agent mode: ask Phi3 (via RagChatService) for a contextual analysis if available ---
                try {
                    String dataJson = objectMapper.writeValueAsString(data);
                    // More explicit agent-mode prompt: request a full JSON analysis and realistic suggestedMeals
                    String prompt = "You are an expert nutrition assistant. Given the user's profile and current day stats (JSON below), return a single valid JSON object. Use French for any human-readable text. Include the following keys when applicable:\n"
                            + "- healthScore: integer (0-100)\n"
                            + "- topAlert: short string\n"
                            + "- quickTip: short string\n"
                            + "- recommendations: array of short strings\n"
                            + "- recommendedWater: integer (ml)\n"
                            + "- carbsWarning: optional string if carbs are high\n"
                            + "- suggestedMeals: array of meal objects (each with name, calories (int), protein (g), carbs (g), fats (g), fiber (g), prepTime (string), diabeticFriendly (bool), reason (string))\n"
                            + "- success: boolean\n"
                            + "Ensure numeric nutrition values are realistic and tailored to the user's age, weight, activityLevel and health conditions (e.g., lower carbs and diabeticFriendly=true for diabetics). If the user has not logged meals today, provide 2-3 suggestedMeals appropriate to their profile instead of empty placeholders. Return only JSON (no explanatory text).\n\nData: " + dataJson;
                    String aiResponse = ragChatService.chatWithRag(prompt, dataJson);

                    // Try to parse AI response as JSON
                    if (aiResponse != null && !aiResponse.isBlank()) {
                        try {
                            Map<String, Object> aiMap = parseAiResponseToMap(aiResponse);
                            if (aiMap != null && !aiMap.isEmpty()) {
                                sanitizeObjectRecursively(aiMap);
                                // Merge AI fields into result (AI overrides local computed values when provided)
                                for (Map.Entry<String, Object> e : aiMap.entrySet()) {
                                    result.put(e.getKey(), e.getValue());
                                }
                            } else {
                                // Keep raw summary when parsing failed
                                result.put("aiSummary", aiResponse);
                            }
                        } catch (Exception pe) {
                            log.debug("Parsing AI response failed", pe);
                            result.put("aiSummary", aiResponse);
                        }
                    }
                } catch (Exception aiEx) {
                    log.warn("Agent mode (Phi3) analysis failed or returned unparseable content", aiEx);
                }

            } catch (Exception e) {
                log.error("Quick analysis failed", e);
                result = getQuickFallback(isDiabetic);
            }

            return result;
        });
    }

    /**
     * Intelligent meal logging with automatic nutrition estimation
     */
    public Map<String, Object> intelligentMealLog(String mealDescription, boolean isDiabetic, Map<String, Object> userProfile) {
         Map<String, Object> result = new HashMap<>();

         try {
            // Parse meal description using local heuristics first
            Map<String, Object> nutritionData = analyzeMealDescription(mealDescription);

            // Agent mode: ask Phi3 (RAG) to refine nutrition estimates using mealDescription + userProfile
            try {
                String profileJson = objectMapper.writeValueAsString(userProfile == null ? Collections.emptyMap() : userProfile);
                String prompt = String.format("Analyze this meal and return JSON with calories, protein, carbs, fats, fiber, diabeticWarning if applicable. Meal: %s\nUserProfile: %s", mealDescription, profileJson);
                String aiResponse = ragChatService.chatWithRag(prompt, profileJson);
                if (aiResponse != null && !aiResponse.isBlank()) {
                    try {
                        Map<String, Object> aiMap = objectMapper.readValue(aiResponse, new TypeReference<Map<String,Object>>(){});
                        // Merge AI-provided nutrition fields if present (override heuristics)
                        for (Map.Entry<String,Object> e : aiMap.entrySet()) {
                            nutritionData.put(e.getKey(), e.getValue());
                        }
                    } catch (Exception pe) {
                        // If AI didn't return JSON, ignore and continue with heuristic
                        log.debug("AI meal analysis returned non-JSON response, ignoring: {}", aiResponse);
                    }
                }
            } catch (Exception ex) {
                log.warn("Agent-mode meal refinement failed", ex);
            }

             // Calculate health metrics
             double healthScore = calculateMealHealthScore(nutritionData, isDiabetic);

             // Generate recommendations
             List<String> recommendations = generateMealRecommendations(nutritionData, isDiabetic);

             result.put("name", mealDescription);
             result.put("calories", nutritionData.getOrDefault("calories", 0));
             result.put("protein", nutritionData.getOrDefault("protein", 0));
             result.put("carbs", nutritionData.getOrDefault("carbs", 0));
             result.put("fats", nutritionData.getOrDefault("fats", 0));
             result.put("fiber", nutritionData.getOrDefault("fiber", 0));
             result.put("netCarbs", calculateNetCarbs(nutritionData));
             result.put("healthScore", Math.round(healthScore));
             result.put("isDiabeticFriendly", isDiabeticFriendly(nutritionData));
             result.put("glycemicLoad", getGlycemicLoad(nutritionData));
             result.put("glucoseImpact", getGlucoseImpact(nutritionData));
             result.put("confidence", 85); // AI confidence score
             result.put("recommendations", recommendations);

             if (isDiabetic && !isDiabeticFriendly(nutritionData)) {
                 result.put("diabeticWarning", "This meal may cause blood sugar spikes. Consider smaller portions or pairing with protein/fiber.");
             }

             result.put("success", true);

         } catch (Exception e) {
             log.error("Meal analysis failed for: " + mealDescription, e);
             result = getMealAnalysisFallback(mealDescription, isDiabetic);
         }

         return result;
     }

    /**
     * Real-time diabetic monitoring with alerts
     */
    public Map<String, Object> diabeticMonitoring(String todayData, int totalCarbs, int glucoseLevel) {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> alerts = new ArrayList<>();

        try {
            // Analyze carb intake
            double carbsPercent = (totalCarbs / 130.0) * 100;
            String status = getHealthStatus(carbsPercent);

            // Generate alerts based on thresholds
            if (totalCarbs > 130) {
                alerts.add(createAlert("danger", "High Carb Intake",
                    "You've exceeded recommended daily carbs (" + totalCarbs + "g/130g)", "REDUCE_CARBS"));
            } else if (totalCarbs > 100) {
                alerts.add(createAlert("warning", "Moderate Carb Intake",
                    "Approaching daily carb limit. Consider low-carb options.", "MONITOR_CARBS"));
            }

            // Glucose level alerts
            if (glucoseLevel > 180) {
                alerts.add(createAlert("danger", "High Blood Sugar",
                    "Blood sugar is elevated. Consider light exercise.", "EXERCISE"));
            }

            // Generate recommendations
            List<String> recommendations = Arrays.asList(
                "Focus on protein and vegetables for remaining meals",
                "Stay hydrated with water",
                "Consider a 10-minute walk after meals",
                "Monitor blood sugar more frequently today"
            );

            result.put("alerts", alerts);
            result.put("carbsPercent", Math.min(100, carbsPercent));
            result.put("status", status);
            result.put("recommendations", recommendations);
            result.put("remainingCarbs", Math.max(0, 130 - totalCarbs));
            result.put("success", true);

        } catch (Exception e) {
            log.error("Diabetic monitoring failed", e);
            result.put("success", false);
            result.put("alerts", new ArrayList<>());
        }

        return result;
    }

    /**
     * Get diabetic-friendly meal suggestions
     */
    public Map<String, Object> diabeticMealSuggestions(int remainingCarbs) {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> meals = new ArrayList<>();

        try {
            // Generate meal suggestions based on remaining carbs
            if (remainingCarbs > 30) {
                meals.add(createMealSuggestion("Grilled Salmon with Quinoa", 25, 35, 12, 5, 92));
                meals.add(createMealSuggestion("Chicken Stir-fry with Vegetables", 20, 28, 8, 6, 88));
            } else if (remainingCarbs > 15) {
                meals.add(createMealSuggestion("Greek Salad with Chicken", 12, 30, 6, 4, 90));
                meals.add(createMealSuggestion("Zucchini Noodles with Turkey", 8, 25, 5, 3, 95));
            } else {
                meals.add(createMealSuggestion("Grilled Chicken Salad", 5, 35, 3, 6, 95));
                meals.add(createMealSuggestion("Egg Omelet with Spinach", 3, 20, 2, 4, 92));
            }

            result.put("meals", meals);
            result.put("success", true);
            result.put("message", "Found " + meals.size() + " diabetic-friendly meals for " + remainingCarbs + "g remaining carbs");

        } catch (Exception e) {
            log.error("Failed to generate diabetic meal suggestions", e);
            result.put("success", false);
            result.put("meals", new ArrayList<>());
        }

        return result;
    }

    /**
     * Generate weekly trends analysis
     */
    public Map<String, Object> generateWeeklyTrends(String weekData, boolean isDiabetic) {
        Map<String, Object> result = new HashMap<>();

        try {
            Map<String, Object> data = parseUserData(weekData);

            // Calculate trends
            Map<String, Object> trends = new HashMap<>();
            trends.put("avgCalories", calculateAverageCalories(data));
            trends.put("avgProtein", calculateAverageProtein(data));
            trends.put("avgCarbs", calculateAverageCarbs(data));
            trends.put("consistencyScore", calculateConsistencyScore(data));

            // Generate insights
            List<String> insights = generateTrendInsights(trends, isDiabetic);

            result.put("trends", trends);
            result.put("insights", insights);
            result.put("success", true);

        } catch (Exception e) {
            log.error("Weekly trends analysis failed", e);
            result.put("success", false);
        }

        return result;
    }

    /**
     * Enhanced food recognition
     */
    public Map<String, Object> recognizeFood(String description) {
        Map<String, Object> result = new HashMap<>();

        try {
            // Use AI to analyze food description
            String prompt = String.format(
                "Analyze this food description and provide nutrition information: '%s'\n" +
                "Provide calories, protein, carbs, fats, and fiber per typical serving.\n" +
                "Also indicate if it's diabetic-friendly and provide a health score (0-100).\n" +
                "Format your response as structured data.",
                description
            );

            String aiResponse = chatLanguageModel.generate(prompt);
            Map<String, Object> nutritionData = parseNutritionResponse(aiResponse, description);

            result.putAll(nutritionData);
            result.put("success", true);
            result.put("confidence", 85);

        } catch (Exception e) {
            log.error("Food recognition failed for: " + description, e);
            result = getFoodRecognitionFallback(description);
        }

        return result;
    }

    /**
     * Calculate water recommendations based on user data
     */
    public Map<String, Object> calculateWaterRecommendations(String userData, String activityLevel, int currentWater) {
        Map<String, Object> result = new HashMap<>();

        try {
            int baseWaterNeeds = WATER_NEEDS_BY_ACTIVITY.getOrDefault(activityLevel, 2500);

            // Adjust for weather, health conditions, etc.
            Map<String, Object> data = parseUserData(userData);
            int adjustedNeeds = adjustWaterForConditions(baseWaterNeeds, data);

            int deficit = Math.max(0, adjustedNeeds - currentWater);
            int hoursLeft = getHoursLeftInDay();
            int hourlyTarget = hoursLeft > 0 ? deficit / hoursLeft : 0;

            result.put("recommendedTotal", adjustedNeeds);
            result.put("currentIntake", currentWater);
            result.put("deficit", deficit);
            result.put("hourlyTarget", hourlyTarget);
            result.put("percentage", Math.min(100, (currentWater * 100) / adjustedNeeds));
            result.put("tips", generateWaterTips(deficit, activityLevel));
            result.put("success", true);

        } catch (Exception e) {
            log.error("Water recommendations failed", e);
            result.put("success", false);
        }

        return result;
    }

    /**
     * Generate contextual nutrition insights
     */
    public Map<String, Object> generateNutritionInsights(String userData, boolean isDiabetic) {
        Map<String, Object> result = new HashMap<>();

        try {
            Map<String, Object> data = parseUserData(userData);
            List<Map<String, Object>> insights = new ArrayList<>();

            // Analyze nutrition patterns
            if (isLowProtein(data)) {
                insights.add(createInsight("warning", "Low Protein Intake",
                    "Consider adding lean proteins to your meals", "protein"));
            }

            if (isHighSodium(data)) {
                insights.add(createInsight("warning", "High Sodium",
                    "Try to reduce processed foods", "sodium"));
            }

            if (isLowFiber(data)) {
                insights.add(createInsight("tip", "Increase Fiber",
                    "Add more vegetables and whole grains", "fiber"));
            }

            if (isDiabetic) {
                insights.addAll(generateDiabeticInsights(data));
            }

            result.put("insights", insights);
            result.put("overallScore", calculateNutritionScore(data, isDiabetic));
            result.put("success", true);

        } catch (Exception e) {
            log.error("Nutrition insights generation failed", e);
            result.put("success", false);
        }

        return result;
    }

    // Helper methods for intelligent analysis

    private Map<String, Object> parseUserData(String userData) {
        try {
            return objectMapper.readValue(userData, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            // Fallback parsing
            Map<String, Object> data = new HashMap<>();
            data.put("calories", 0);
            data.put("carbs", 0);
            data.put("protein", 0);
            data.put("water", 0);
            data.put("meals", 0);
            return data;
        }
    }

    private int calculateHealthScore(Map<String, Object> data, boolean isDiabetic) {
        int score = 70; // Base score

        int calories = ((Number) data.getOrDefault("calories", 0)).intValue();
        int carbs = ((Number) data.getOrDefault("carbs", 0)).intValue();
        int protein = ((Number) data.getOrDefault("protein", 0)).intValue();
        int water = ((Number) data.getOrDefault("water", 0)).intValue();
        int meals = ((Number) data.getOrDefault("meals", 0)).intValue();

        // Get goals from data
        int caloriesGoal = ((Number) data.getOrDefault("caloriesGoal", 2000)).intValue();
        int proteinGoal = ((Number) data.getOrDefault("proteinGoal", 50)).intValue();
        int carbsGoal = ((Number) data.getOrDefault("carbsGoal", 250)).intValue();
        int waterGoal = ((Number) data.getOrDefault("waterGoal", 2000)).intValue();

        // Calorie balance (target: 80-120% of goal)
        double calPercent = (double) calories / caloriesGoal;
        if (calPercent >= 0.8 && calPercent <= 1.2) score += 10;
        else if (calPercent < 0.5 || calPercent > 1.5) score -= 15;

        // Protein adequacy
        if (protein >= proteinGoal) score += 10;
        else if (protein < proteinGoal * 0.5) score -= 10;

        // Hydration
        if (water >= waterGoal) score += 10;
        else if (water < waterGoal * 0.5) score -= 10;

        // Meal frequency
        if (meals >= 3) score += 5;
        else if (meals < 2) score -= 10;

        // Diabetic-specific scoring
        if (isDiabetic) {
            if (carbs <= carbsGoal) score += 15;
            else if (carbs > carbsGoal * 1.2) score -= 20;
        }

        return Math.max(0, Math.min(100, score));
    }

    private String generateTopAlert(Map<String, Object> data, boolean isDiabetic) {
        int water = ((Number) data.getOrDefault("water", 0)).intValue();
        int carbs = ((Number) data.getOrDefault("carbs", 0)).intValue();
        int meals = ((Number) data.getOrDefault("meals", 0)).intValue();

        int waterGoal = ((Number) data.getOrDefault("waterGoal", 2000)).intValue();
        int carbsGoal = ((Number) data.getOrDefault("carbsGoal", 250)).intValue();

        if (isDiabetic && carbs > carbsGoal) {
            return "⚠️ Carb intake exceeded daily limit";
        } else if (water < waterGoal * 0.5) {
            return "💧 Increase water intake - you're dehydrated";
        } else if (meals < 2) {
            return "🍽️ Don't skip meals - aim for 3 balanced meals";
        } else {
            return "👍 You're doing great! Keep tracking your nutrition";
        }
    }

    private String generateQuickTip(Map<String, Object> data, boolean isDiabetic) {
        int water = ((Number) data.getOrDefault("water", 0)).intValue();
        int protein = ((Number) data.getOrDefault("protein", 0)).intValue();

        int proteinGoal = ((Number) data.getOrDefault("proteinGoal", 50)).intValue();

        if (isDiabetic) {
            return "Focus on protein and vegetables for stable blood sugar";
        } else if (water < 1500) {
            return "Drink a glass of water now to boost hydration";
        } else if (protein < proteinGoal * 0.8) {
            return "Add protein-rich foods to your next meal";
        } else {
            return "Consider a healthy snack if you're feeling hungry";
        }
    }

    private int calculateWaterNeeds(Map<String, Object> data) {
        // Base calculation: 2000ml + adjustments
        int baseNeeds = 2000;

        // Adjust based on activity (if available in data)
        String activity = (String) data.getOrDefault("activityLevel", "moderate");
        return WATER_NEEDS_BY_ACTIVITY.getOrDefault(activity, baseNeeds);
    }

    private String generateCarbsWarning(Map<String, Object> data) {
        int carbs = ((Number) data.getOrDefault("carbs", 0)).intValue();
        int carbsGoal = ((Number) data.getOrDefault("carbsGoal", 250)).intValue();

        if (carbs > carbsGoal * 1.2) {
            return "Carb intake is very high - monitor blood glucose closely";
        } else if (carbs > carbsGoal) {
            return "Above recommended daily carbs - consider low-carb dinner";
        }
        return null;
    }

    private List<String> generateContextualRecommendations(Map<String, Object> data, boolean isDiabetic) {
        List<String> recommendations = new ArrayList<>();

        int water = ((Number) data.getOrDefault("water", 0)).intValue();
        int protein = ((Number) data.getOrDefault("protein", 0)).intValue();
        int carbs = ((Number) data.getOrDefault("carbs", 0)).intValue();

        int proteinGoal = ((Number) data.getOrDefault("proteinGoal", 50)).intValue();

        if (water < 1500) {
            recommendations.add("💧 Drink more water - aim for 8 glasses today");
        }

        if (protein < proteinGoal) {
            recommendations.add("🍗 Include protein in your next meal");
        }

        if (isDiabetic && carbs < 50) {
            recommendations.add("🍞 You can have more complex carbs today");
        } else if (isDiabetic && carbs > 100) {
            recommendations.add("🥦 Focus on vegetables for remaining meals");
        }

        recommendations.add("🚶‍♂️ Take a 10-minute walk after your next meal");

        return recommendations;
    }

    // New helper: produce automatic actions when agentMode is active
    // Returns a structured map with possible actions for frontend to execute or present
    public Map<String, Object> autoAct(Map<String, Object> userData, boolean isDiabetic) {
        Map<String, Object> actions = new HashMap<>();

        try {
            Map<String, Object> data = (userData != null) ? userData : parseUserData("{}");

            // 1) Hydration action
            int recommended = calculateWaterNeeds(data);
            int current = ((Number) data.getOrDefault("water", 0)).intValue();
            int deficit = Math.max(0, recommended - current);
            if (deficit > 0) {
                Map<String, Object> waterAction = new HashMap<>();
                waterAction.put("type", "remind_water");
                waterAction.put("amount_ml", Math.min(deficit, 500)); // suggest up to 500ml at once
                waterAction.put("message", "💧 You are behind on your water goal — let's add a glass now.");
                actions.put("water", waterAction);
            }

            // 2) Carb monitoring
            int carbs = ((Number) data.getOrDefault("carbs", 0)).intValue();
            if (isDiabetic && carbs > 130) {
                Map<String, Object> carbAction = new HashMap<>();
                carbAction.put("type", "suggest_low_carb_meals");
                carbAction.put("remainingCarbs", Math.max(0, 130 - carbs));
                Map<String, Object> suggestions = diabeticMealSuggestions(Math.max(0, 130 - carbs));
                carbAction.put("suggestions", suggestions.getOrDefault("meals", Collections.emptyList()));
                actions.put("carbs", carbAction);
            }

            // 3) Quick tips if low protein
            int protein = ((Number) data.getOrDefault("protein", 0)).intValue();
            int proteinGoal = ((Number) data.getOrDefault("proteinGoal", 50)).intValue();
            if (protein < proteinGoal * 0.6) {
                Map<String, Object> tipAction = new HashMap<>();
                tipAction.put("type", "tip_add_protein");
                tipAction.put("message", "🍗 Try a protein-rich snack to meet your daily target.");
                actions.put("protein", tipAction);
            }

            actions.put("success", true);
        } catch (Exception e) {
            log.warn("autoAct failed", e);
            actions.put("success", false);
        }

        return actions;
    }

    // --- Fallbacks and helper implementations to satisfy compile and provide basic behavior ---

    private Map<String, Object> getQuickFallback(boolean isDiabetic) {
        Map<String, Object> fallback = new HashMap<>();
        fallback.put("healthScore", 65);
        fallback.put("topAlert", isDiabetic ? "⚠️ Limited data for diabetic analysis" : "Limited data available");
        fallback.put("quickTip", "Keep tracking meals and water for better insights.");
        fallback.put("recommendedWater", 2000);
        fallback.put("waterDeficit", 0);
        fallback.put("recommendations", Collections.emptyList());
        fallback.put("success", false);
        return fallback;
    }

    private Map<String, Object> analyzeMealDescription(String mealDescription) {
        // Very small heuristic parser: find words matching our small FOOD_NUTRITION_DB
        Map<String, Object> out = new HashMap<>();
        double calories = 0, protein = 0, carbs = 0, fats = 0, fiber = 0;
        String lower = mealDescription == null ? "" : mealDescription.toLowerCase();
        for (String food : FOOD_NUTRITION_DB.keySet()) {
            if (lower.contains(food)) {
                Map<String, Double> info = FOOD_NUTRITION_DB.get(food);
                calories += info.getOrDefault("calories", 0.0);
                protein += info.getOrDefault("protein", 0.0);
                carbs += info.getOrDefault("carbs", 0.0);
                fats += info.getOrDefault("fats", 0.0);
                // fiber not in db, leave at 0
            }
        }
        if (calories == 0) calories = 300; // fallback estimate
        out.put("calories", (int)Math.round(calories));
        out.put("protein", (int)Math.round(protein));
        out.put("carbs", (int)Math.round(carbs));
        out.put("fats", (int)Math.round(fats));
        out.put("fiber", (int)Math.round(fiber));
        return out;
    }

    private double calculateMealHealthScore(Map<String, Object> nutritionData, boolean isDiabetic) {
        int calories = ((Number) nutritionData.getOrDefault("calories", 0)).intValue();
        int protein = ((Number) nutritionData.getOrDefault("protein", 0)).intValue();
        int carbs = ((Number) nutritionData.getOrDefault("carbs", 0)).intValue();
        int fats = ((Number) nutritionData.getOrDefault("fats", 0)).intValue();

        double score = 70;
        if (calories > 0 && calories < 700) score += 5;
        if (protein >= 15) score += 10;
        if (carbs > 60) score -= isDiabetic ? 20 : 5;
        if (fats > 30) score -= 5;
        return Math.max(0, Math.min(100, score));
    }

    private List<String> generateMealRecommendations(Map<String, Object> nutritionData, boolean isDiabetic) {
        List<String> recs = new ArrayList<>();
        int carbs = ((Number) nutritionData.getOrDefault("carbs", 0)).intValue();
        int protein = ((Number) nutritionData.getOrDefault("protein", 0)).intValue();
        if (protein < 15) recs.add("Add a serving of lean protein (chicken, fish, yogurt)");
        if (isDiabetic && carbs > 40) recs.add("Reduce portion size of high-carb items or pair with fiber/protein");
        if (recs.isEmpty()) recs.add("Looks balanced — keep it up!");
        return recs;
    }

    private int calculateNetCarbs(Map<String, Object> nutritionData) {
        int carbs = ((Number) nutritionData.getOrDefault("carbs", 0)).intValue();
        int fiber = ((Number) nutritionData.getOrDefault("fiber", 0)).intValue();
        return Math.max(0, carbs - fiber);
    }

    private boolean isDiabeticFriendly(Map<String, Object> nutritionData) {
        int carbs = ((Number) nutritionData.getOrDefault("carbs", 0)).intValue();
        return carbs <= 40; // simple heuristic
    }

    private double getGlycemicLoad(Map<String, Object> nutritionData) {
        int carbs = ((Number) nutritionData.getOrDefault("carbs", 0)).intValue();
        // naive GL estimate: carbs * 0.5
        return Math.round(carbs * 0.5 * 10.0) / 10.0;
    }

    private double getGlucoseImpact(Map<String, Object> nutritionData) {
        // rough proxy of immediate glucose impact
        return Math.min(100, ((Number) nutritionData.getOrDefault("carbs", 0)).intValue() * 0.8);
    }

    private Map<String, Object> getMealAnalysisFallback(String mealDescription, boolean isDiabetic) {
        Map<String, Object> fallback = new HashMap<>();
        Map<String, Object> n = analyzeMealDescription(mealDescription);
        fallback.putAll(n);
        fallback.put("healthScore", Math.round(calculateMealHealthScore(n, isDiabetic)));
        fallback.put("isDiabeticFriendly", isDiabeticFriendly(n));
        fallback.put("success", false);
        fallback.put("recommendations", generateMealRecommendations(n, isDiabetic));
        return fallback;
    }

    private String getHealthStatus(double carbsPercent) {
        if (carbsPercent > 120) return "Unhealthy";
        if (carbsPercent > 80) return "At Risk";
        return "OK";
    }

    private Map<String, Object> createAlert(String level, String title, String message, String code) {
        Map<String, Object> a = new HashMap<>();
        a.put("type", level);
        a.put("title", title);
        a.put("message", message);
        a.put("code", code);
        return a;
    }

    private Map<String, Object> createMealSuggestion(String name, int carbs, int calories, int protein, int fats, int score) {
        Map<String, Object> meal = new HashMap<>();
        meal.put("name", name);
        meal.put("totalCarbs", carbs);
        meal.put("totalCalories", calories);
        meal.put("totalProtein", protein);
        meal.put("totalFat", fats);
        meal.put("healthScore", score);
        meal.put("foods", Collections.emptyList());
        return meal;
    }

    private double calculateAverageCalories(Map<String, Object> data) {
        // if data contains daily list, try to compute; otherwise fallback
        Object arr = data.get("days");
        if (arr instanceof List) {
            List<?> days = (List<?>) arr;
            if (days.isEmpty()) return 0;
            double sum = 0; int count = 0;
            for (Object d : days) {
                if (d instanceof Map) {
                    Object c = ((Map<?,?>)d).get("calories");
                    if (c instanceof Number) { sum += ((Number)c).doubleValue(); count++; }
                }
            }
            return count==0?0:sum/count;
        }
        return ((Number) data.getOrDefault("calories", 0)).doubleValue();
    }

    private double calculateAverageProtein(Map<String, Object> data) {
        return ((Number) data.getOrDefault("protein", 0)).doubleValue();
    }

    private double calculateAverageCarbs(Map<String, Object> data) {
        return ((Number) data.getOrDefault("carbs", 0)).doubleValue();
    }

    private double calculateConsistencyScore(Map<String, Object> data) {
        // simple heuristic: number of recorded days vs 7
        Object arr = data.get("days");
        if (arr instanceof List) {
            int days = ((List<?>)arr).size();
            return Math.min(100, (days / 7.0) * 100);
        }
        return 50;
    }

    private List<String> generateTrendInsights(Map<String, Object> trends, boolean isDiabetic) {
        List<String> insights = new ArrayList<>();
        double avgCalories = ((Number) trends.getOrDefault("avgCalories", 0)).doubleValue();
        if (avgCalories > 2500) insights.add("High average calorie intake this week");
        if (isDiabetic) insights.add("Consider more low-carb meals based on weekly trends");
        if (insights.isEmpty()) insights.add("Trends look stable.");
        return insights;
    }

    private Map<String, Object> parseNutritionResponse(String aiResponse, String description) {
        // Very naive attempt: try to parse JSON returned by model, otherwise fallback to analyzeMealDescription
        try {
            if (aiResponse != null && aiResponse.trim().startsWith("{")) {
                return objectMapper.readValue(aiResponse, new TypeReference<Map<String,Object>>(){});
            }
        } catch (Exception e) {
            // ignore - fallback
        }
        return analyzeMealDescription(description);
    }

    private Map<String, Object> getFoodRecognitionFallback(String description) {
        Map<String, Object> f = analyzeMealDescription(description);
        f.put("success", false);
        return f;
    }

    private int adjustWaterForConditions(int baseNeeds, Map<String, Object> data) {
        int adjusted = baseNeeds;
        // Increase if hot or very active
        String weather = (String) data.getOrDefault("weather", "normal");
        if ("hot".equalsIgnoreCase(weather)) adjusted += 300;
        String activity = (String) data.getOrDefault("activityLevel", "moderate");
        if ("active".equalsIgnoreCase(activity)) adjusted += 200;
        return adjusted;
    }

    private int getHoursLeftInDay() {
        Calendar c = Calendar.getInstance();
        int hour = c.get(Calendar.HOUR_OF_DAY);
        return Math.max(1, 24 - hour);
    }

    private List<String> generateWaterTips(int deficit, String activityLevel) {
        List<String> tips = new ArrayList<>();
        if (deficit <= 0) { tips.add("You're on track — keep it up."); return tips; }
        tips.add("Sip water regularly — aim for a glass every hour.");
        if ("active".equalsIgnoreCase(activityLevel)) tips.add("Include an electrolyte-rich drink if exercising.");
        return tips;
    }

    private boolean isLowProtein(Map<String, Object> data) {
        int protein = ((Number) data.getOrDefault("protein", 0)).intValue();
        return protein < 40;
    }

    private Map<String, Object> createInsight(String type, String title, String message, String key) {
        Map<String, Object> i = new HashMap<>();
        i.put("type", type);
        i.put("title", title);
        i.put("message", message);
        i.put("key", key);
        return i;
    }

    private boolean isHighSodium(Map<String, Object> data) {
        // Sodium not modelled in our simple data; return false
        return false;
    }

    private boolean isLowFiber(Map<String, Object> data) {
        int fiber = ((Number) data.getOrDefault("fiber", 0)).intValue();
        return fiber < 15;
    }

    private List<Map<String, Object>> generateDiabeticInsights(Map<String, Object> data) {
        List<Map<String,Object>> list = new ArrayList<>();
        int carbs = ((Number) data.getOrDefault("carbs", 0)).intValue();
        if (carbs > 130) list.add(createInsight("warning","High Carbs","Consider low-carb options","carbs"));
        return list;
    }

    private int calculateNutritionScore(Map<String, Object> data, boolean isDiabetic) {
        // Compose a simple score from hydration/protein/carbs
        int score = 60;
        int water = ((Number) data.getOrDefault("water", 0)).intValue();
        int protein = ((Number) data.getOrDefault("protein", 0)).intValue();
        int carbs = ((Number) data.getOrDefault("carbs", 0)).intValue();
        if (water >= 2000) score += 10;
        if (protein >= 50) score += 10;
        if (isDiabetic && carbs <= 130) score += 10;
        return Math.max(0, Math.min(100, score));
    }

    // Expose for debug: returns the last userData parsed by quickAnalyze
    public Map<String, Object> getLastReceivedUserData() {
        return lastReceivedUserData == null ? Collections.emptyMap() : lastReceivedUserData;
    }

    // Attempt to extract JSON from AI response and convert to Map
    private Map<String, Object> parseAiResponseToMap(String aiResponse) {
        if (aiResponse == null) return Collections.emptyMap();

        // Remove common markdown code fences and language tags
        String cleaned = aiResponse.replaceAll("(?i)```\\s*json", "");
        cleaned = cleaned.replaceAll("```", "");

        // Remove unicode replacement and control characters that often break parsing
        cleaned = cleaned.replaceAll("\\uFFFD", "");
        // Trim surrounding whitespace
        cleaned = cleaned.trim();

        // Find first JSON object/array start
        int idxObj = cleaned.indexOf('{');
        int idxArr = cleaned.indexOf('[');
        int start = -1;
        char startChar = 0;
        if (idxObj >= 0 && (idxObj < idxArr || idxArr == -1)) { start = idxObj; startChar='}'; }
        else if (idxArr >= 0) { start = idxArr; startChar=']'; }

        String jsonCandidate = cleaned;
        if (start >= 0) {
            // find last matching bracket
            int last = cleaned.lastIndexOf(startChar);
            if (last > start) {
                jsonCandidate = cleaned.substring(start, last + 1);
            } else {
                jsonCandidate = cleaned.substring(start);
            }
        }

        // Normalize quotes (convert smart quotes to straight quotes) to help parsing
        jsonCandidate = jsonCandidate.replace("“", "\"").replace("”", "\"").replace("‘", "'").replace("’", "'");

        // Remove control characters except common whitespace (use Unicode escapes)
        jsonCandidate = jsonCandidate.replaceAll("[\u0000-\u001F\u007F-\u009F]", "");

        // Remove JavaScript-style single-line comments (// ...) and block comments (/* ... */)
        try {
            // remove block comments
            jsonCandidate = jsonCandidate.replaceAll("(?s)/\\*.*?\\*/", "");
            // remove line comments
            jsonCandidate = jsonCandidate.replaceAll("(?m)//.*$", "");
            // remove trailing commas before closing } or ] using lookahead
            jsonCandidate = jsonCandidate.replaceAll(",\\s*(?=\\}|\\])", "");
            // Trim again
            jsonCandidate = jsonCandidate.trim();
        } catch (Exception ex) {
            // ignore cleaning errors and continue to try parsing
        }

        try {
            if (jsonCandidate.startsWith("{")) {
                return objectMapper.readValue(jsonCandidate, new TypeReference<Map<String, Object>>(){});
            } else if (jsonCandidate.startsWith("[")) {
                // If array returned, wrap into map under 'suggestedMeals'
                List<Object> arr = objectMapper.readValue(jsonCandidate, new TypeReference<List<Object>>(){});
                Map<String, Object> wrapper = new HashMap<>();
                wrapper.put("suggestedMeals", arr);
                return wrapper;
            }
        } catch (Exception e) {
            log.debug("Failed to parse jsonCandidate from AI response: {}", e.getMessage());
            // fallthrough
        }

        return Collections.emptyMap();
    }

    // Recursively sanitize strings inside maps/lists to remove control chars and replacement artifacts
    @SuppressWarnings("unchecked")
    private void sanitizeObjectRecursively(Object obj) {
        if (obj instanceof Map) {
            Map<String, Object> map = (Map<String, Object>) obj;
            for (Map.Entry<String, Object> e : new HashMap<>(map).entrySet()) {
                Object v = e.getValue();
                if (v instanceof String) {
                    String s = (String) v;
                    s = s.replaceAll("[\\u0000-\\u001F\\u007F-\\u009F\\uFFFD]", "");
                    map.put(e.getKey(), s);
                } else if (v instanceof Map || v instanceof List) {
                    sanitizeObjectRecursively(v);
                }
            }
        } else if (obj instanceof List) {
            List<Object> list = (List<Object>) obj;
            for (int i = 0; i < list.size(); i++) {
                Object v = list.get(i);
                if (v instanceof String) {
                    String s = (String) v;
                    s = s.replaceAll("[\\u0000-\\u001F\\u007F-\\u009F\\uFFFD]", "");
                    list.set(i, s);
                } else if (v instanceof Map || v instanceof List) {
                    sanitizeObjectRecursively(v);
                }
            }
        }
    }
}
