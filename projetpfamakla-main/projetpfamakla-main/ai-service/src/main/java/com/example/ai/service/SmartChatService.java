package com.example.ai.service;

import dev.langchain4j.model.chat.ChatLanguageModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class SmartChatService {


    private static final Logger log = LoggerFactory.getLogger(SmartChatService.class);
    private final ChatLanguageModel chatLanguageModel;
    private final ObjectMapper objectMapper = new ObjectMapper();


    public SmartChatService(
            ChatLanguageModel chatLanguageModel
    ) {
        this.chatLanguageModel = chatLanguageModel;
    }
    /**
     * Smart chat with intent detection and action suggestions
     */
    public Map<String, Object> smartChat(String message, String userContext) {
        Map<String, Object> response = new HashMap<>();

        // Build AI prompt with intent detection instructions
        StringBuilder prompt = new StringBuilder();
        prompt.append("You are Phi3, a professional nutrition and dietetics assistant. ");
        prompt.append("Your goal is to help users track their nutrition accurately. Analyze the user message and determine the intent:\n");
        prompt.append("1. LOG_MEAL: User ate something. Extract: food name, calories, protein(g), carbs(g), fats(g), fiber(g). ESTIMATE these if not provided.\n");
        prompt.append("2. LOG_WATER: User drank something. Extract: volume in ml. (e.g. 1 glass = 250ml, 1 bottle = 500ml).\n");
        prompt.append("3. GET_REPORT: User wants a diagnostic or summary.\n");
        prompt.append("4. GET_ADVICE: User asks for tips or what to eat.\n\n");

        if (userContext != null && !userContext.isEmpty()) {
            try {
                Map<String, Object> profile = objectMapper.readValue(userContext, new TypeReference<Map<String, Object>>() {});
                StringBuilder profileText = new StringBuilder("User Profile:\n");
                if (profile.containsKey("age")) profileText.append("- Age: ").append(profile.get("age")).append("\n");
                if (profile.containsKey("weight")) profileText.append("- Weight: ").append(profile.get("weight")).append(" kg\n");
                if (profile.containsKey("height")) profileText.append("- Height: ").append(profile.get("height")).append(" cm\n");
                if (profile.containsKey("gender")) profileText.append("- Gender: ").append(profile.get("gender")).append("\n");
                if (profile.containsKey("activityLevel")) profileText.append("- Activity Level: ").append(profile.get("activityLevel")).append("\n");
                if (profile.containsKey("healthConditions")) {
                    List<String> conditions = (List<String>) profile.get("healthConditions");
                    if (conditions != null && !conditions.isEmpty()) {
                        profileText.append("- Health Conditions: ").append(String.join(", ", conditions)).append("\n");
                    }
                }
                if (profile.containsKey("dietaryPreferences")) {
                    List<String> diets = (List<String>) profile.get("dietaryPreferences");
                    if (diets != null && !diets.isEmpty()) {
                        profileText.append("- Dietary Preferences: ").append(String.join(", ", diets)).append("\n");
                    }
                }
                if (profile.containsKey("goals")) {
                    List<String> goals = (List<String>) profile.get("goals");
                    if (goals != null && !goals.isEmpty()) {
                        profileText.append("- Goals: ").append(String.join(", ", goals)).append("\n");
                    }
                }
                if (profile.containsKey("dailyCalorieGoal")) profileText.append("- Daily Calorie Goal: ").append(profile.get("dailyCalorieGoal")).append(" kcal\n");
                if (profile.containsKey("dailyWaterGoal")) profileText.append("- Daily Water Goal: ").append(profile.get("dailyWaterGoal")).append(" ml\n");
                if (profile.containsKey("dailyCarbLimit")) profileText.append("- Daily Carb Limit: ").append(profile.get("dailyCarbLimit")).append(" g\n");
                prompt.append(profileText.toString()).append("\n");
            } catch (Exception e) {
                prompt.append("User's Personal Data:\n").append(userContext).append("\n\n");
            }
            prompt.append("CRITICAL INSTRUCTION: You MUST analyze and use the User's Profile in your response. For GET_ADVICE intent, provide recommendations that specifically address the user's age, weight, height, BMI, gender, activity level, goals (lose weight, maintain, gain weight), health conditions (e.g., diabetes, high blood pressure), dietary preferences, and daily nutrition goals (calories, protein, carbs, fats, water). Do not give generic advice. Tailor your response to these details. Calculate BMI if possible and mention it.\n\n");
        }

        prompt.append("User Message: \"").append(message).append("\"\n\n");
        prompt.append("Respond EXCLUSIVELY in this format:\n");
        prompt.append("INTENT: [INTENT_NAME]\n");
        prompt.append("RESPONSE: [A brief, encouraging response in French if the user speaks French, else English. For GET_ADVICE, make it personalized based on user data]\n");
        prompt.append("DATA: food=[name], calories=[num], protein=[num], carbs=[num], fat=[num], fiber=[num]\n");
        prompt.append("DATA: water=[ml]\n\n");
        prompt.append("If intent is LOG_MEAL, your DATA line must include estimates for all macros.");

        try {
            log.info("Sending smart chat message to Phi3: {}", message);
            String aiResponse = chatLanguageModel.generate(prompt.toString());
            log.info("Received smart chat response from Phi3");

            // Parse the structured response
            String intent = extractValue(aiResponse, "INTENT");
            String responseText = extractValue(aiResponse, "RESPONSE");
            String dataText = extractValue(aiResponse, "DATA");

            response.put("intent", intent != null ? intent : detectSimpleIntent(message));
            response.put("response", responseText != null ? responseText : aiResponse);

            // Parse action data if present
            if (dataText != null && !dataText.trim().isEmpty()) {
                Map<String, Object> actionData = parseActionData(dataText);
                if (!actionData.isEmpty()) {
                    response.put("actionData", actionData);
                }
            } else {
                // Fallback parsing for meals and water
                Map<String, Object> actionData = extractActionDataFromMessage(message);
                if (!actionData.isEmpty()) {
                    response.put("actionData", actionData);
                }
            }

        } catch (Exception e) {
            log.error("Error in smart chat with Phi3: {}", e.getMessage());
            response.put("intent", "ERROR");
            response.put("response", "I'm having trouble connecting to my AI brain right now. Please ensure Ollama is running with phi3 model.");
        }

        return response;
    }

    /**
     * Generate nutrition diagnostic report
     */
    public String generateDiagnostic(String userData) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("You are Phi3, a nutrition expert. Generate a comprehensive health report based on this user data:\n\n");
        prompt.append(userData).append("\n\n");
        prompt.append("Provide:\n");
        prompt.append("1. Overall Health Summary\n");
        prompt.append("2. Nutritional Analysis\n");
        prompt.append("3. Specific Recommendations\n");
        prompt.append("4. Areas for Improvement\n");
        prompt.append("5. Action Items\n\n");
        prompt.append("Make it actionable and encouraging.");

        try {
            log.info("Generating diagnostic report with Phi3");
            return chatLanguageModel.generate(prompt.toString());
        } catch (Exception e) {
            log.error("Error generating diagnostic with Phi3: {}", e.getMessage());
            return "Diagnostic report is temporarily unavailable. Please ensure Ollama is running with phi3 model.";
        }
    }

    // Helper methods for parsing AI responses
    private String extractValue(String response, String key) {
        try {
            Pattern pattern = Pattern.compile(key + ":\\s*(.+?)(?:\n|$)", Pattern.CASE_INSENSITIVE);
            Matcher matcher = pattern.matcher(response);
            if (matcher.find()) {
                return matcher.group(1).trim();
            }
        } catch (Exception e) {
            log.warn("Error extracting value for key {}: {}", key, e.getMessage());
        }
        return null;
    }

    private String detectSimpleIntent(String message) {
        String lowerMessage = message.toLowerCase();
        // English & French detection
        if (lowerMessage.matches(".*(ate|eat|meal|food|breakfast|lunch|dinner|mangé|repas|déjeuner|diner|souper).*")) {
            return "LOG_MEAL";
        }
        if (lowerMessage.matches(".*(water|drink|glass|ml|liter|eau|boire|verre).*")) {
            return "LOG_WATER";
        }
        if (lowerMessage.matches(".*(report|stats|progress|summary|rapport|statistiques).*")) {
            return "GET_REPORT";
        }
        if (lowerMessage.matches(".*(advice|help|recommend|suggest|conseil|aider|sugg).*")) {
            return "GET_ADVICE";
        }
        return "CHAT";
    }

    private Map<String, Object> parseActionData(String dataText) {
        Map<String, Object> data = new HashMap<>();
        try {
            String[] parts = dataText.split(",");
            for (String part : parts) {
                if (part.contains("=")) {
                    String[] keyValue = part.split("=", 2);
                    if (keyValue.length == 2) {
                        String key = keyValue[0].trim().toLowerCase();
                        String value = keyValue[1].trim();

                        if (key.equals("calories")) {
                            Integer cal = parseInteger(value);
                            if (cal != null && cal > 0) data.put("calories", cal);
                        } else if (key.equals("protein") || key.equals("prot")) {
                            data.put("protein", parseInteger(value));
                        } else if (key.equals("carbs") || key.equals("carbohydrates")) {
                            data.put("carbs", parseInteger(value));
                        } else if (key.equals("fat") || key.equals("lipids")) {
                            data.put("fats", parseInteger(value));
                        } else if (key.equals("glasses") || key.equals("water")) {
                            Integer val = parseInteger(value);
                            if (val != null) {
                                // If value is small, treat as glasses, else treat as ml
                                if (val < 10) data.put("glasses", val);
                                else data.put("waterAmount", val);
                            }
                        } else if (key.equals("food")) {
                            data.put("mealName", value);
                        } else if (key.equals("fiber")) {
                            data.put("fiber", parseInteger(value));
                        } else {
                            data.put(key, value);
                        }
                    }
                }
            }
            
            // Fallback estimation if calories missing but food name present
            if (data.containsKey("mealName") && !data.containsKey("calories")) {
                data.put("calories", estimateCalories((String) data.get("mealName")));
            }
            
        } catch (Exception e) {
            log.warn("Error parsing action data: {}", e.getMessage());
        }
        return data;
    }
    
    private Integer parseInteger(String value) {
        try {
            if (value == null || value.trim().isEmpty()) return null;
            String numberOnly = value.replaceAll("[^0-9]", "");
            if (numberOnly.isEmpty()) return null;
            return Integer.parseInt(numberOnly);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Map<String, Object> extractActionDataFromMessage(String message) {
        Map<String, Object> data = new HashMap<>();
        String lowerMessage = message.toLowerCase();

        // Extract water glasses
        Pattern waterPattern = Pattern.compile("(\\d+)\\s*(?:glass|glasses|cup|cups)", Pattern.CASE_INSENSITIVE);
        Matcher waterMatcher = waterPattern.matcher(message);
        if (waterMatcher.find()) {
            data.put("glasses", Integer.parseInt(waterMatcher.group(1)));
        }

        // Extract meal information (basic)
        if (lowerMessage.contains("ate") || lowerMessage.contains("eat") || lowerMessage.contains("mangé")) {
            // Try to extract food name
            String[] words = message.split("\\s+");
            for (int i = 0; i < words.length - 1; i++) {
                if (words[i].toLowerCase().matches("(ate|eat|had|mangé)")) {
                    if (i + 1 < words.length) {
                        String food = words[i + 1];
                        if (i + 2 < words.length && !words[i + 2].toLowerCase().matches("(for|at|in|on)")) {
                            food += " " + words[i + 2];
                        }
                        data.put("mealName", food);
                        data.put("calories", estimateCalories(food)); // Basic estimation
                        break;
                    }
                }
            }
        }

        return data;
    }

    private int estimateCalories(String food) {
        String lowerFood = food.toLowerCase();
        // Basic calorie estimation
        if (lowerFood.contains("pizza")) return 600;
        if (lowerFood.contains("burger")) return 700;
        if (lowerFood.contains("salad") || lowerFood.contains("salade")) return 200;
        if (lowerFood.contains("sandwich")) return 400;
        if (lowerFood.contains("apple") || lowerFood.contains("pomme")) return 80;
        if (lowerFood.contains("banana") || lowerFood.contains("banane")) return 120;
        if (lowerFood.contains("rice") || lowerFood.contains("riz")) return 200;
        if (lowerFood.contains("chicken") || lowerFood.contains("poulet")) return 300;
        if (lowerFood.contains("egg") || lowerFood.contains("oeuf")) return 150;
        return 300; // Default
    }
}
