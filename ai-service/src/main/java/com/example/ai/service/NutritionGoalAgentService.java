package com.example.ai.service;

import dev.langchain4j.model.chat.ChatLanguageModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Agent intelligent pour la gestion dynamique des objectifs nutritionnels
 * Analyse le profil utilisateur et suggÃ¨re/met Ã  jour les objectifs
 */
@Service
public class NutritionGoalAgentService {


    private static final Logger log = LoggerFactory.getLogger(NutritionGoalAgentService.class);
    private final RagChatService ragChatService;
    private final GoalCalculationService goalCalculationService;
    private final ChatLanguageModel chatLanguageModel;

    // Historique des dÃ©cisions de l'agent (pour audit)
    private final Map<String, List<Map<String, Object>>> agentHistory = new HashMap<>();


    public NutritionGoalAgentService(
            RagChatService ragChatService,
            GoalCalculationService goalCalculationService,
            ChatLanguageModel chatLanguageModel
    ) {
        this.ragChatService = ragChatService;
        this.goalCalculationService = goalCalculationService;
        this.chatLanguageModel = chatLanguageModel;
    }
    /**
     * Analyse le profil utilisateur et suggÃ¨re de nouveaux objectifs
     */
    public Map<String, Object> analyzeProfileAndSuggestGoals(Map<String, Object> userProfile, Map<String, Object> currentData) {
        try {
            log.info("Agent analyzing user profile for goal recommendations");

            // 1. Calculer les objectifs optimaux
            Map<String, Object> calculatedGoals = goalCalculationService.calculatePersonalizedGoals(userProfile);

            // 2. Comparer avec les objectifs actuels
            Map<String, Object> comparison = compareGoals(
                getCurrentGoals(userProfile),
                calculatedGoals
            );

            // 3. Utiliser l'IA pour gÃ©nÃ©rer une explication personnalisÃ©e
            String aiExplanation = generateGoalExplanation(userProfile, calculatedGoals, comparison);

            // 4. Construire la rÃ©ponse
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("suggestedGoals", extractSuggestedGoals(calculatedGoals));
            result.put("currentGoals", getCurrentGoals(userProfile));
            result.put("changes", comparison.get("changes"));
            result.put("significantChange", comparison.get("significantChange"));
            result.put("explanation", aiExplanation);
            result.put("confidence", calculateConfidence(userProfile));
            result.put("recommendations", calculatedGoals.get("recommendations"));
            result.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME));

            // 5. Enregistrer dans l'historique
            recordDecision(getUserId(userProfile), "GOAL_SUGGESTION", result);

            return result;

        } catch (Exception e) {
            log.error("Error analyzing profile for goal suggestions", e);
            return createErrorResponse("Failed to analyze profile");
        }
    }

    /**
     * Met Ã  jour les objectifs aprÃ¨s confirmation utilisateur
     */
    public Map<String, Object> updateGoalsWithUserConfirmation(
            String userId,
            Map<String, Object> newGoals,
            boolean userAccepted,
            String userFeedback) {

        try {
            Map<String, Object> result = new HashMap<>();

            if (!userAccepted) {
                result.put("success", false);
                result.put("message", "User rejected goal updates");
                result.put("userFeedback", userFeedback);
                recordDecision(userId, "GOAL_REJECTED", result);
                return result;
            }

            // Valider les objectifs avant mise Ã  jour
            if (!validateGoals(newGoals)) {
                result.put("success", false);
                result.put("message", "Invalid goals - safety limits exceeded");
                return result;
            }

            // Enregistrer l'historique
            Map<String, Object> updateRecord = new HashMap<>();
            updateRecord.put("goals", newGoals);
            updateRecord.put("timestamp", LocalDateTime.now());
            updateRecord.put("userFeedback", userFeedback);
            updateRecord.put("method", "AI_AGENT_SUGGESTION");

            recordDecision(userId, "GOAL_UPDATED", updateRecord);

            result.put("success", true);
            result.put("message", "Goals updated successfully");
            result.put("newGoals", newGoals);
            result.put("appliedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME));

            log.info("Goals updated for user {} with confirmation", userId);
            return result;

        } catch (Exception e) {
            log.error("Error updating goals", e);
            return createErrorResponse("Failed to update goals");
        }
    }

    /**
     * Analyse contextuelle quotidienne avec ajustements dynamiques
     */
    public Map<String, Object> dailyContextAnalysis(String userId, Map<String, Object> todayData) {
        try {
            Map<String, Object> result = new HashMap<>();
            List<Map<String, Object>> suggestions = new ArrayList<>();

            // Analyser les donnÃ©es du jour
            int caloriesConsumed = getIntValue(todayData, "calories", 0);
            int caloriesGoal = getIntValue(todayData, "caloriesGoal", 2000);
            int waterConsumed = getIntValue(todayData, "water", 0);
            int waterGoal = getIntValue(todayData, "waterGoal", 2500);

            // Suggestion 1: Ajustement calorique si Ã©cart important
            if (Math.abs(caloriesConsumed - caloriesGoal) > 500) {
                suggestions.add(createSuggestion(
                    "CALORIE_ADJUSTMENT",
                    "Ajustement calorique recommandÃ©",
                    String.format("Votre consommation (%d kcal) diffÃ¨re significativement de votre objectif (%d kcal)",
                                  caloriesConsumed, caloriesGoal),
                    Map.of("type", "calories", "suggested", caloriesGoal)
                ));
            }

            // Suggestion 2: Hydratation
            if (waterConsumed < waterGoal * 0.7) {
                suggestions.add(createSuggestion(
                    "HYDRATION_REMINDER",
                    "Hydratation insuffisante",
                    String.format("Il vous reste %d ml Ã  boire aujourd'hui", waterGoal - waterConsumed),
                    Map.of("type", "water", "remaining", waterGoal - waterConsumed)
                ));
            }

            result.put("success", true);
            result.put("suggestions", suggestions);
            result.put("requiresAction", !suggestions.isEmpty());

            return result;

        } catch (Exception e) {
            log.error("Error in daily context analysis", e);
            return createErrorResponse("Analysis failed");
        }
    }

    /**
     * GÃ©nÃ¨re une explication IA personnalisÃ©e pour les objectifs
     */
    private String generateGoalExplanation(Map<String, Object> profile, Map<String, Object> goals, Map<String, Object> comparison) {
        try {
            StringBuilder prompt = new StringBuilder();
            prompt.append("Tu es un nutritionniste expert. Explique ces nouveaux objectifs nutritionnels Ã  l'utilisateur de maniÃ¨re claire et motivante.\n\n");
            prompt.append("Profil utilisateur:\n");
            prompt.append(String.format("- Ã‚ge: %s ans\n", profile.getOrDefault("age", "?")));
            prompt.append(String.format("- Poids: %s kg\n", profile.getOrDefault("weight", "?")));
            prompt.append(String.format("- ActivitÃ©: %s\n", profile.getOrDefault("activityLevel", "modÃ©rÃ©e")));

            List<String> conditions = getListValue(profile, "healthConditions");
            if (!conditions.isEmpty()) {
                prompt.append(String.format("- Conditions de santÃ©: %s\n", String.join(", ", conditions)));
            }

            prompt.append("\nObjectifs calculÃ©s:\n");
            prompt.append(String.format("- Calories: %s kcal/jour\n", goals.get("caloriesGoal")));
            prompt.append(String.format("- Eau: %s ml/jour\n", goals.get("waterGoal")));
            prompt.append(String.format("- Glucides: %s g/jour\n", goals.get("carbsGoal")));
            prompt.append(String.format("- ProtÃ©ines: %s g/jour\n", goals.get("proteinGoal")));

            prompt.append("\nExplique en 2-3 phrases pourquoi ces objectifs sont adaptÃ©s. Sois encourageant et spÃ©cifique aux conditions de santÃ© si prÃ©sentes.");

            return chatLanguageModel.generate(prompt.toString());

        } catch (Exception e) {
            log.error("Error generating AI explanation", e);
            return "Ces objectifs sont calculÃ©s selon votre profil pour vous aider Ã  atteindre vos objectifs de santÃ© de maniÃ¨re sÃ»re et efficace.";
        }
    }

    /**
     * Compare les objectifs actuels et suggÃ©rÃ©s
     */
    private Map<String, Object> compareGoals(Map<String, Integer> current, Map<String, Object> suggested) {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> changes = new ArrayList<>();

        int currentCalories = current.getOrDefault("calories", 2000);
        int suggestedCalories = (int) suggested.getOrDefault("caloriesGoal", 2000);

        if (Math.abs(currentCalories - suggestedCalories) > 200) {
            changes.add(createChange("calories", currentCalories, suggestedCalories));
        }

        int currentWater = current.getOrDefault("water", 2500);
        int suggestedWater = (int) suggested.getOrDefault("waterGoal", 2500);

        if (Math.abs(currentWater - suggestedWater) > 300) {
            changes.add(createChange("water", currentWater, suggestedWater));
        }

        result.put("changes", changes);
        result.put("significantChange", changes.size() > 0);

        return result;
    }

    /**
     * Valide que les objectifs sont dans des limites sÃ»res
     */
    private boolean validateGoals(Map<String, Object> goals) {
        int calories = getIntValue(goals, "calories", 0);
        int water = getIntValue(goals, "water", 0);
        int carbs = getIntValue(goals, "carbs", 0);

        // Limites de sÃ©curitÃ©
        return calories >= 1200 && calories <= 4000 &&
               water >= 1500 && water <= 5000 &&
               carbs >= 50 && carbs <= 400;
    }

    /**
     * Calcule le niveau de confiance de la recommandation
     */
    private int calculateConfidence(Map<String, Object> profile) {
        int confidence = 70; // Base

        if (profile.containsKey("age") && profile.containsKey("weight") && profile.containsKey("height")) {
            confidence += 15;
        }
        if (profile.containsKey("activityLevel")) {
            confidence += 10;
        }
        if (!getListValue(profile, "healthConditions").isEmpty()) {
            confidence += 5;
        }

        return Math.min(100, confidence);
    }

    /**
     * Enregistre les dÃ©cisions de l'agent pour audit
     */
    private void recordDecision(String userId, String action, Map<String, Object> details) {
        agentHistory.computeIfAbsent(userId, k -> new ArrayList<>()).add(Map.of(
            "action", action,
            "timestamp", LocalDateTime.now(),
            "details", details
        ));

        log.info("Agent decision recorded: {} for user {}", action, userId);
    }

    /**
     * Obtient l'historique des dÃ©cisions pour un utilisateur
     */
    public List<Map<String, Object>> getAgentHistory(String userId) {
        return agentHistory.getOrDefault(userId, new ArrayList<>());
    }

    // MÃ©thodes utilitaires

    private Map<String, Integer> getCurrentGoals(Map<String, Object> profile) {
        Map<String, Integer> goals = new HashMap<>();
        goals.put("calories", getIntValue(profile, "dailyCalorieGoal", 2000));
        goals.put("water", getIntValue(profile, "dailyWaterGoal", 2500));
        goals.put("carbs", getIntValue(profile, "dailyCarbLimit", 250));
        return goals;
    }

    private Map<String, Object> extractSuggestedGoals(Map<String, Object> calculated) {
        Map<String, Object> goals = new HashMap<>();
        goals.put("calories", calculated.get("caloriesGoal"));
        goals.put("water", calculated.get("waterGoal"));
        goals.put("carbs", calculated.get("carbsGoal"));
        goals.put("protein", calculated.get("proteinGoal"));
        goals.put("fat", calculated.get("fatGoal"));
        goals.put("fiber", calculated.get("fiberGoal"));
        return goals;
    }

    private Map<String, Object> createChange(String metric, int current, int suggested) {
        Map<String, Object> change = new HashMap<>();
        change.put("metric", metric);
        change.put("current", current);
        change.put("suggested", suggested);
        change.put("difference", suggested - current);
        change.put("percentChange", Math.round(((double)(suggested - current) / current) * 100));
        return change;
    }

    private Map<String, Object> createSuggestion(String type, String title, String message, Map<String, Object> data) {
        Map<String, Object> suggestion = new HashMap<>();
        suggestion.put("type", type);
        suggestion.put("title", title);
        suggestion.put("message", message);
        suggestion.put("data", data);
        suggestion.put("timestamp", LocalDateTime.now());
        return suggestion;
    }

    private Map<String, Object> createErrorResponse(String message) {
        return Map.of(
            "success", false,
            "error", message,
            "timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME)
        );
    }

    private String getUserId(Map<String, Object> profile) {
        Object id = profile.get("userId");
        return id != null ? id.toString() : "unknown";
    }

    private int getIntValue(Map<String, Object> map, String key, int defaultValue) {
        Object value = map.get(key);
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        return defaultValue;
    }

    @SuppressWarnings("unchecked")
    private List<String> getListValue(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value instanceof List) {
            return (List<String>) value;
        }
        return new ArrayList<>();
    }
}

