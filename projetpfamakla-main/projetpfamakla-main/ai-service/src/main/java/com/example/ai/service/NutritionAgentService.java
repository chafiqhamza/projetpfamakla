package com.example.ai.service;

import dev.langchain4j.model.chat.ChatLanguageModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Intelligent Nutrition Agent that proactively analyzes user data
 * and provides actionable recommendations with automatic app interactions
 */
@Service
public class NutritionAgentService {


    private static final Logger log = LoggerFactory.getLogger(NutritionAgentService.class);
    private final ChatLanguageModel chatLanguageModel;


    public NutritionAgentService(
            ChatLanguageModel chatLanguageModel
    ) {
        this.chatLanguageModel = chatLanguageModel;
    }
    /**
     * Analyze user's complete nutrition profile and generate proactive recommendations
     */
    public Map<String, Object> analyzeAndAct(String userData, String userProfile) {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> actions = new ArrayList<>();

        StringBuilder prompt = new StringBuilder();
        prompt.append("You are an intelligent nutrition AI agent for the Makla app. ");
        prompt.append("Your role is to PROACTIVELY help users by analyzing their data and suggesting specific actions.\n\n");

        prompt.append("=== USER DATA ===\n");
        prompt.append(userData != null ? userData : "No data available");
        prompt.append("\n\n");

        if (userProfile != null && !userProfile.isEmpty()) {
            prompt.append("=== USER PROFILE ===\n");
            prompt.append(userProfile);
            prompt.append("\n\n");
        }

        prompt.append("=== YOUR TASK ===\n");
        prompt.append("Analyze the data and provide a JSON response with:\n");
        prompt.append("1. insights: Array of key observations about their nutrition\n");
        prompt.append("2. alerts: Array of urgent health warnings (if any)\n");
        prompt.append("3. recommendations: Array of specific actionable tips\n");
        prompt.append("4. suggestedActions: Array of automatic actions the app should take\n");
        prompt.append("5. dailyGoals: Object with recommended daily targets\n");
        prompt.append("6. healthScore: Number 0-100 based on their habits\n");
        prompt.append("7. motivationalMessage: Encouraging message for the user\n\n");

        prompt.append("For suggestedActions, use these types:\n");
        prompt.append("- {type: 'ADD_WATER_REMINDER', data: {intervalMinutes: 60}}\n");
        prompt.append("- {type: 'SUGGEST_MEAL', data: {mealType: 'breakfast/lunch/dinner', suggestions: ['food1', 'food2']}}\n");
        prompt.append("- {type: 'UPDATE_GOAL', data: {goalType: 'calories/water/protein', value: number}}\n");
        prompt.append("- {type: 'SHOW_STATISTIC', data: {statType: 'weekly/monthly', metric: 'calories/water'}}\n");
        prompt.append("- {type: 'HEALTH_CHECK', data: {checkType: 'hydration/nutrition/balance'}}\n\n");

        prompt.append("Respond ONLY with valid JSON. Be specific with numbers based on the data.\n");

        try {
            String aiResponse = chatLanguageModel.generate(prompt.toString());
            result = parseAgentResponse(aiResponse);
            result.put("success", true);
            result.put("timestamp", LocalDateTime.now().toString());
        } catch (Exception e) {
            log.error("Agent analysis failed", e);
            result.put("success", false);
            result.put("error", "AI agent temporarily unavailable");
            result.put("insights", List.of("Keep tracking your meals and water intake!"));
            result.put("recommendations", List.of(
                "Aim for 8 glasses of water daily",
                "Include protein in every meal",
                "Eat colorful vegetables"
            ));
            result.put("healthScore", 70);
            result.put("motivationalMessage", "Every healthy choice counts! Keep going! ðŸ’ª");
        }

        return result;
    }

    /**
     * Generate personalized meal suggestions based on user preferences and health conditions
     */
    public Map<String, Object> suggestMeals(String userProfile, String mealType, String restrictions) {
        Map<String, Object> result = new HashMap<>();

        StringBuilder prompt = new StringBuilder();
        prompt.append("You are a nutrition expert. Suggest 5 specific meal options.\n\n");
        prompt.append("Meal Type: ").append(mealType != null ? mealType : "any").append("\n");
        prompt.append("User Profile: ").append(userProfile != null ? userProfile : "general adult").append("\n");
        prompt.append("Dietary Restrictions: ").append(restrictions != null ? restrictions : "none").append("\n\n");

        prompt.append("Respond with JSON:\n");
        prompt.append("{\n");
        prompt.append("  \"meals\": [\n");
        prompt.append("    {\"name\": \"Meal Name\", \"calories\": 400, \"protein\": 25, \"carbs\": 45, \"fats\": 15, \"description\": \"Brief description\", \"ingredients\": [\"item1\", \"item2\"]}\n");
        prompt.append("  ],\n");
        prompt.append("  \"reasoning\": \"Why these meals are recommended\"\n");
        prompt.append("}\n");

        try {
            String aiResponse = chatLanguageModel.generate(prompt.toString());
            result = parseJsonResponse(aiResponse);
            result.put("success", true);
        } catch (Exception e) {
            result.put("success", false);
            result.put("meals", getDefaultMealSuggestions(mealType));
            result.put("reasoning", "Based on general nutrition guidelines");
        }

        return result;
    }

    /**
     * Calculate and analyze daily/weekly statistics with AI insights
     */
    public Map<String, Object> generateStatistics(String mealsData, String waterData, String period) {
        Map<String, Object> result = new HashMap<>();

        StringBuilder prompt = new StringBuilder();
        prompt.append("Analyze this nutrition data and calculate detailed statistics.\n\n");
        prompt.append("Period: ").append(period != null ? period : "today").append("\n");
        prompt.append("Meals Data: ").append(mealsData != null ? mealsData : "[]").append("\n");
        prompt.append("Water Data: ").append(waterData != null ? waterData : "[]").append("\n\n");

        prompt.append("Calculate and respond with JSON:\n");
        prompt.append("{\n");
        prompt.append("  \"summary\": {\n");
        prompt.append("    \"totalCalories\": number,\n");
        prompt.append("    \"totalProtein\": number,\n");
        prompt.append("    \"totalCarbs\": number,\n");
        prompt.append("    \"totalFats\": number,\n");
        prompt.append("    \"totalWaterMl\": number,\n");
        prompt.append("    \"mealsCount\": number\n");
        prompt.append("  },\n");
        prompt.append("  \"goals\": {\n");
        prompt.append("    \"caloriesGoal\": 2000,\n");
        prompt.append("    \"waterGoalMl\": 2500,\n");
        prompt.append("    \"proteinGoal\": 50\n");
        prompt.append("  },\n");
        prompt.append("  \"progress\": {\n");
        prompt.append("    \"caloriesPercent\": number,\n");
        prompt.append("    \"waterPercent\": number,\n");
        prompt.append("    \"proteinPercent\": number\n");
        prompt.append("  },\n");
        prompt.append("  \"trends\": [\"trend observation 1\", \"trend observation 2\"],\n");
        prompt.append("  \"aiInsight\": \"Detailed analysis and recommendation\"\n");
        prompt.append("}\n");

        try {
            String aiResponse = chatLanguageModel.generate(prompt.toString());
            result = parseJsonResponse(aiResponse);
            result.put("success", true);
        } catch (Exception e) {
            result.put("success", false);
            result.put("summary", Map.of(
                "totalCalories", 0,
                "totalWaterMl", 0,
                "mealsCount", 0
            ));
            result.put("aiInsight", "Start logging your meals and water to get personalized insights!");
        }

        return result;
    }

    /**
     * Process natural language commands and execute app actions
     */
    public Map<String, Object> processCommand(String command, String context) {
        Map<String, Object> result = new HashMap<>();

        StringBuilder prompt = new StringBuilder();
        prompt.append("You are an AI assistant that controls a nutrition app. Parse the user's command and determine what action to take.\n\n");
        prompt.append("User Command: ").append(command).append("\n");
        prompt.append("Current Context: ").append(context != null ? context : "Dashboard view").append("\n\n");

        prompt.append("Available Actions:\n");
        prompt.append("1. ADD_MEAL: Log a new meal {mealName, calories, protein, carbs, fats, mealType}\n");
        prompt.append("2. ADD_WATER: Log water intake {amountMl}\n");
        prompt.append("3. SET_GOAL: Update daily goal {goalType, value}\n");
        prompt.append("4. SHOW_STATS: Display statistics {period: today/week/month}\n");
        prompt.append("5. GET_SUGGESTIONS: Get meal suggestions {mealType, restrictions}\n");
        prompt.append("6. NAVIGATE: Go to a page {page: dashboard/meals/water/foods/diagnostic}\n");
        prompt.append("7. SCHEDULE_REMINDER: Set a reminder {type, time, message}\n");
        prompt.append("8. GENERATE_REPORT: Create nutrition report {reportType}\n");
        prompt.append("9. CHAT: Just respond conversationally\n\n");

        prompt.append("Respond with JSON:\n");
        prompt.append("{\n");
        prompt.append("  \"action\": \"ACTION_TYPE\",\n");
        prompt.append("  \"parameters\": {action-specific data},\n");
        prompt.append("  \"response\": \"What to tell the user\",\n");
        prompt.append("  \"followUp\": \"Optional follow-up question or suggestion\"\n");
        prompt.append("}\n");

        try {
            String aiResponse = chatLanguageModel.generate(prompt.toString());
            result = parseJsonResponse(aiResponse);
            result.put("success", true);

            // Ensure action field exists
            if (!result.containsKey("action")) {
                result.put("action", "CHAT");
            }
        } catch (Exception e) {
            result.put("success", false);
            result.put("action", "CHAT");
            result.put("response", "I understand you want help with your nutrition. Could you be more specific?");
        }

        return result;
    }

    /**
     * Generate proactive health alerts based on user patterns
     */
    public Map<String, Object> checkHealthAlerts(String userData) {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, String>> alerts = new ArrayList<>();

        StringBuilder prompt = new StringBuilder();
        prompt.append("Analyze this user's nutrition data and identify any health concerns or positive patterns.\n\n");
        prompt.append("User Data: ").append(userData).append("\n\n");
        prompt.append("Check for:\n");
        prompt.append("- Dehydration risk (low water intake)\n");
        prompt.append("- Calorie deficiency or excess\n");
        prompt.append("- Meal skipping patterns\n");
        prompt.append("- Nutritional imbalances\n");
        prompt.append("- Positive habits to reinforce\n\n");

        prompt.append("Respond with JSON:\n");
        prompt.append("{\n");
        prompt.append("  \"alerts\": [{\"type\": \"warning/info/success\", \"title\": \"Alert Title\", \"message\": \"Details\", \"priority\": \"high/medium/low\"}],\n");
        prompt.append("  \"overallStatus\": \"good/needs-attention/critical\",\n");
        prompt.append("  \"quickTip\": \"One actionable tip right now\"\n");
        prompt.append("}\n");

        try {
            String aiResponse = chatLanguageModel.generate(prompt.toString());
            result = parseJsonResponse(aiResponse);
            result.put("success", true);
        } catch (Exception e) {
            result.put("success", false);
            result.put("alerts", List.of());
            result.put("overallStatus", "unknown");
            result.put("quickTip", "Remember to log your meals and water intake!");
        }

        return result;
    }

    // Helper methods
    private Map<String, Object> parseAgentResponse(String response) {
        return parseJsonResponse(response);
    }

    private Map<String, Object> parseJsonResponse(String response) {
        Map<String, Object> result = new HashMap<>();

        try {
            // Find JSON content in response
            int jsonStart = response.indexOf("{");
            int jsonEnd = response.lastIndexOf("}");

            if (jsonStart >= 0 && jsonEnd > jsonStart) {
                String jsonStr = response.substring(jsonStart, jsonEnd + 1);
                // Basic JSON parsing - in production use Jackson or Gson
                result.put("rawResponse", jsonStr);

                // Extract common fields
                extractFieldToMap(result, jsonStr, "action");
                extractFieldToMap(result, jsonStr, "response");
                extractFieldToMap(result, jsonStr, "healthScore");
                extractFieldToMap(result, jsonStr, "motivationalMessage");
                extractFieldToMap(result, jsonStr, "overallStatus");
                extractFieldToMap(result, jsonStr, "quickTip");
                extractFieldToMap(result, jsonStr, "aiInsight");
                extractFieldToMap(result, jsonStr, "reasoning");
                extractFieldToMap(result, jsonStr, "followUp");
            } else {
                result.put("response", response);
            }
        } catch (Exception e) {
            result.put("response", response);
        }

        return result;
    }

    private void extractFieldToMap(Map<String, Object> map, String json, String field) {
        String value = extractField(json, field);
        if (value != null && !value.isEmpty()) {
            // Try to parse as number
            try {
                map.put(field, Integer.parseInt(value));
            } catch (NumberFormatException e) {
                map.put(field, value);
            }
        }
    }

    private String extractField(String json, String fieldName) {
        try {
            String searchKey = "\"" + fieldName + "\"";
            int startIndex = json.indexOf(searchKey);
            if (startIndex == -1) return null;

            int colonIndex = json.indexOf(":", startIndex);
            int valueStart = colonIndex + 1;

            while (valueStart < json.length() && (json.charAt(valueStart) == ' ' || json.charAt(valueStart) == '\"')) {
                valueStart++;
            }

            int valueEnd = valueStart;
            boolean inQuotes = json.charAt(colonIndex + 1) == '\"' || (valueStart > 0 && json.charAt(valueStart - 1) == '\"');

            if (inQuotes) {
                valueEnd = json.indexOf("\"", valueStart);
            } else {
                while (valueEnd < json.length() && json.charAt(valueEnd) != ',' && json.charAt(valueEnd) != '}' && json.charAt(valueEnd) != '\n') {
                    valueEnd++;
                }
            }

            if (valueEnd > valueStart) {
                return json.substring(valueStart, valueEnd).trim();
            }
        } catch (Exception e) {
            // Silent fail
        }
        return null;
    }

    private List<Map<String, Object>> getDefaultMealSuggestions(String mealType) {
        List<Map<String, Object>> meals = new ArrayList<>();

        if ("breakfast".equalsIgnoreCase(mealType)) {
            meals.add(Map.of("name", "Oatmeal with Fruits", "calories", 350, "protein", 12, "description", "Healthy fiber-rich breakfast"));
            meals.add(Map.of("name", "Greek Yogurt Parfait", "calories", 280, "protein", 15, "description", "Protein-packed morning meal"));
            meals.add(Map.of("name", "Whole Grain Toast with Eggs", "calories", 400, "protein", 20, "description", "Classic balanced breakfast"));
        } else if ("lunch".equalsIgnoreCase(mealType)) {
            meals.add(Map.of("name", "Grilled Chicken Salad", "calories", 450, "protein", 35, "description", "Light and nutritious"));
            meals.add(Map.of("name", "Quinoa Buddha Bowl", "calories", 500, "protein", 18, "description", "Plant-based powerhouse"));
            meals.add(Map.of("name", "Turkey Sandwich", "calories", 420, "protein", 28, "description", "Satisfying and balanced"));
        } else {
            meals.add(Map.of("name", "Grilled Salmon", "calories", 500, "protein", 40, "description", "Omega-3 rich dinner"));
            meals.add(Map.of("name", "Chicken Stir Fry", "calories", 450, "protein", 35, "description", "Vegetables and protein"));
            meals.add(Map.of("name", "Vegetable Pasta", "calories", 480, "protein", 15, "description", "Comfort food made healthy"));
        }

        return meals;
    }
}

