package com.example.ai.service;

import dev.langchain4j.model.chat.ChatLanguageModel;
import org.springframework.stereotype.Service;

@Service
public class RecommendationService {

    private final ChatLanguageModel chatLanguageModel;

    public RecommendationService(ChatLanguageModel chatLanguageModel) {
        this.chatLanguageModel = chatLanguageModel;
    }

    public String getRecommendations(String userPreferences) {
        String systemPrompt = """
            You are a nutritionist. Generate 3 meal recommendations based on the user's preferences.
            Format the output strictly as a JSON array of objects with keys: 'name', 'calories', 'reason'.
            Do not include any markdown formatting or extra text. Just the JSON.
            """;
        
        try {
            return chatLanguageModel.generate(systemPrompt + "\nUser Preferences: " + userPreferences);
        } catch (Exception e) {
            // Fallback mock response so the UI doesn't break
            return """
                [
                  {"name": "Mediterranean Salad (Offline Mode)", "calories": "350", "reason": "Fresh and healthy"},
                  {"name": "Grilled Fish (Offline Mode)", "calories": "400", "reason": "High protein"},
                  {"name": "Vegetable Stir Fry (Offline Mode)", "calories": "300", "reason": "Low calorie"}
                ]
                """;
        }
    }
}
