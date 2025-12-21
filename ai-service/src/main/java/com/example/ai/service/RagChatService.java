package com.example.ai.service;

import dev.langchain4j.model.chat.ChatLanguageModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * Service de chat amÃ©liorÃ© avec RAG (Retrieval-Augmented Generation)
 * Utilise la base de connaissances nutritionnelle pour des rÃ©ponses contextuelles
 */
@Service
public class RagChatService {


    private static final Logger log = LoggerFactory.getLogger(RagChatService.class);
    private final ChatLanguageModel chatLanguageModel;
    private final NutritionKnowledgeService knowledgeService;


    public RagChatService(
            ChatLanguageModel chatLanguageModel,
            NutritionKnowledgeService knowledgeService
    ) {
        this.chatLanguageModel = chatLanguageModel;
        this.knowledgeService = knowledgeService;
    }
    /**
     * Chat avec RAG : recherche dans la base de connaissances et gÃ©nÃ¨re une rÃ©ponse contextuelle
     */
    public String chatWithRag(String message, String userContext) {
        try {
            log.info("Processing RAG chat request: {}", message);

            // 1. Rechercher les connaissances pertinentes
            List<String> relevantKnowledge = knowledgeService.searchKnowledge(message, 3);

            // 2. Construire le prompt enrichi
            StringBuilder promptBuilder = new StringBuilder();
            promptBuilder.append("Tu es Phi3, un assistant nutritionnel intelligent pour la plateforme Makla.\n");
            promptBuilder.append("Tu aides les utilisateurs Ã  suivre leurs repas, leur hydratation et fournis des conseils santÃ© personnalisÃ©s.\n\n");

            // Ajouter les connaissances rÃ©cupÃ©rÃ©es
            if (!relevantKnowledge.isEmpty()) {
                promptBuilder.append("Utilise ces informations nutritionnelles pour rÃ©pondre :\n");
                for (int i = 0; i < relevantKnowledge.size(); i++) {
                    promptBuilder.append(String.format("%d. %s\n", i + 1, relevantKnowledge.get(i)));
                }
                promptBuilder.append("\n");
            }

            // Ajouter le contexte utilisateur
            if (userContext != null && !userContext.isEmpty()) {
                promptBuilder.append("DonnÃ©es actuelles de l'utilisateur :\n").append(userContext).append("\n\n");
                promptBuilder.append("Utilise ces donnÃ©es pour fournir des conseils personnalisÃ©s.\n\n");
            }

            // Question de l'utilisateur
            promptBuilder.append("Utilisateur : ").append(message).append("\n");
            promptBuilder.append("Phi3 (rÃ©ponds de maniÃ¨re amicale et concise) : ");

            // 3. GÃ©nÃ©rer la rÃ©ponse avec le modÃ¨le
            String response = chatLanguageModel.generate(promptBuilder.toString());

            // Nettoyer la rÃ©ponse
            response = cleanResponse(response);

            // If the response looks like JSON, validate it. If invalid (placeholders/zeros), retry with stricter guidance.
            try {
                String validated = validateAndMaybeRetry(response, promptBuilder.toString(), userContext);
                log.info("RAG chat response generated successfully (validated)");
                return validated;
            } catch (Exception ve) {
                log.warn("Validation/retry failed, returning original response", ve);
                log.info("RAG chat response generated successfully");
                return response;
            }

        } catch (Exception e) {
            log.error("Error in RAG chat: {}", e.getMessage(), e);
            return fallbackResponse(message);
        }
    }

    /**
     * Chat avec dÃ©tection d'intention pour les choix utilisateur
     */
    public Map<String, Object> chatWithIntentDetection(String message, String userContext) {
        try {
            // DÃ©tecter l'intention
            String intent = detectIntent(message);

            // GÃ©nÃ©rer la rÃ©ponse avec RAG
            String response = chatWithRag(message, userContext);

            return Map.of(
                "response", response,
                "intent", intent,
                "requiresUserChoice", isChoiceRequired(intent),
                "suggestedActions", getSuggestedActions(intent)
            );

        } catch (Exception e) {
            log.error("Error in intent detection", e);
            return Map.of(
                "response", chatWithRag(message, userContext),
                "intent", "unknown",
                "requiresUserChoice", false
            );
        }
    }

    /**
     * DÃ©tecte l'intention de l'utilisateur
     */
    private String detectIntent(String message) {
        String lowerMessage = message.toLowerCase();

        // DÃ©tection des rÃ©ponses affirmatives/nÃ©gatives
        if (lowerMessage.matches(".*(oui|yes|d'accord|ok|parfait|accepte|bien sÃ»r).*")) {
            return "ACCEPT";
        }
        if (lowerMessage.matches(".*(non|no|refuse|pas|jamais|dÃ©saccord).*")) {
            return "REJECT";
        }
        if (lowerMessage.matches(".*(peut-Ãªtre|peut Ãªtre|hÃ©sit|voir|rÃ©flÃ©ch|plus tard).*")) {
            return "MAYBE";
        }

        // DÃ©tection des demandes
        if (lowerMessage.contains("repas") || lowerMessage.contains("meal") || lowerMessage.contains("manger")) {
            return "ASK_MEAL";
        }
        if (lowerMessage.contains("eau") || lowerMessage.contains("water") || lowerMessage.contains("boire")) {
            return "ASK_WATER";
        }
        if (lowerMessage.contains("objectif") || lowerMessage.contains("goal") || lowerMessage.contains("cible")) {
            return "ASK_GOALS";
        }
        if (lowerMessage.contains("analyse") || lowerMessage.contains("rapport") || lowerMessage.contains("statist")) {
            return "ASK_ANALYSIS";
        }
        if (lowerMessage.contains("diabÃ¨te") || lowerMessage.contains("diabetic") || lowerMessage.contains("glycÃ©mie")) {
            return "ASK_DIABETIC";
        }

        return "GENERAL_QUESTION";
    }

    /**
     * VÃ©rifie si un choix utilisateur est requis
     */
    private boolean isChoiceRequired(String intent) {
        return intent.equals("ASK_GOALS") || intent.equals("ASK_DIABETIC");
    }

    /**
     * Obtient les actions suggÃ©rÃ©es basÃ©es sur l'intention
     */
    private List<String> getSuggestedActions(String intent) {
        return switch (intent) {
            case "ASK_MEAL" -> List.of("suggest_meals", "log_meal", "view_meal_history");
            case "ASK_WATER" -> List.of("add_water", "view_water_intake", "set_water_goal");
            case "ASK_GOALS" -> List.of("analyze_profile", "update_goals", "view_current_goals");
            case "ASK_ANALYSIS" -> List.of("daily_analysis", "weekly_trends", "health_score");
            case "ASK_DIABETIC" -> List.of("diabetic_meal_plan", "carb_tracking", "glucose_monitoring");
            default -> List.of();
        };
    }

    /**
     * Nettoie la rÃ©ponse du modÃ¨le
     */
    private String cleanResponse(String response) {
        if (response == null) return "";

        // Supprimer les prÃ©fixes communs
        response = response.replaceFirst("^Phi3:\\s*", "");
        response = response.replaceFirst("^Assistant:\\s*", "");

        return response.trim();
    }

    /**
     * RÃ©ponse de secours en cas d'erreur
     */
    private String fallbackResponse(String message) {
        String lowerMessage = message.toLowerCase();

        if (lowerMessage.contains("repas") || lowerMessage.contains("meal")) {
            return "Je suis lÃ  pour vous aider avec vos repas ! Je peux vous suggÃ©rer des recettes saines, " +
                   "analyser vos repas ou vous aider Ã  planifier vos menus. Que souhaitez-vous faire ?";
        }
        if (lowerMessage.contains("eau") || lowerMessage.contains("water")) {
            return "L'hydratation est essentielle ! Je recommande de boire entre 2 et 3 litres d'eau par jour, " +
                   "selon votre niveau d'activitÃ©. Voulez-vous que je vous aide Ã  suivre votre consommation ?";
        }
        if (lowerMessage.contains("diabÃ¨te") || lowerMessage.contains("diabetic")) {
            return "Pour la gestion du diabÃ¨te, il est important de contrÃ´ler l'apport en glucides. " +
                   "Je peux vous aider Ã  suivre vos glucides et suggÃ©rer des repas adaptÃ©s. " +
                   "L'objectif recommandÃ© est d'environ 130g de glucides par jour.";
        }

        return "Bonjour ! Je suis Phi3, votre assistant nutritionnel. Je peux vous aider avec vos repas, " +
               "votre hydratation, et fournir des conseils santÃ© personnalisÃ©s. " +
               "N'hÃ©sitez pas Ã  me poser vos questions !";
    }

    /**
     * Chat simple sans RAG (fallback)
     */
    public String simpleChat(String message, String context) {
        try {
            StringBuilder promptBuilder = new StringBuilder();
            promptBuilder.append("Tu es Phi3, un assistant nutritionnel pour Makla. ");
            promptBuilder.append("RÃ©ponds de maniÃ¨re amicale et concise.\n\n");

            if (context != null && !context.isEmpty()) {
                promptBuilder.append("Contexte : ").append(context).append("\n\n");
            }

            promptBuilder.append("Utilisateur : ").append(message).append("\n");
            promptBuilder.append("Phi3 : ");

            String response = chatLanguageModel.generate(promptBuilder.toString());
            return cleanResponse(response);

        } catch (Exception e) {
            log.error("Error in simple chat", e);
            return fallbackResponse(message);
        }
    }

    /**
     * Validate AI JSON and retry once with more restrictive prompt if needed.
     */
    private String validateAndMaybeRetry(String initialResponse, String originalPrompt, String userContext) throws Exception {
        // If initialResponse doesn't start with '{' attempt to find JSON inside; otherwise use as-is
        String candidate = initialResponse.trim();
        if (!candidate.startsWith("{")) {
            int idx = candidate.indexOf('{');
            if (idx >= 0) candidate = candidate.substring(idx);
        }

        // Quick check: try parse and inspect some numeric fields
        boolean ok = false;
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            Map<String,Object> map = mapper.readValue(candidate, new com.fasterxml.jackson.core.type.TypeReference<Map<String,Object>>(){});
            // If suggestedMeals exist and have numeric calories/protein > 0 -> ok
            if (map.containsKey("suggestedMeals")) {
                Object arr = map.get("suggestedMeals");
                if (arr instanceof java.util.List) {
                    java.util.List<?> list = (java.util.List<?>) arr;
                    if (!list.isEmpty()) {
                        Object first = list.get(0);
                        if (first instanceof Map) {
                            Map<?,?> meal = (Map<?,?>) first;
                            Number cals = meal.get("calories") instanceof Number ? (Number) meal.get("calories") : null;
                            Number prot = meal.get("protein") instanceof Number ? (Number) meal.get("protein") : null;
                            if (cals != null && cals.intValue() > 50) ok = true;
                            if (prot != null && prot.intValue() > 0) ok = true;
                        }
                    }
                }
            }
            // Also consider healthScore > 0
            if (!ok && map.containsKey("healthScore")) {
                Object hs = map.get("healthScore");
                if (hs instanceof Number && ((Number)hs).intValue() > 0) ok = true;
            }
        } catch (Exception e) {
            // parsing failed - not ok
            ok = false;
        }

        if (ok) return initialResponse; // already valid

        // Retry with stricter prompt: force only JSON, realistic numeric values, French
        String retryPrompt = "IMPORTANT: The previous response contained placeholders or zeros. RETURN ONLY A SINGLE VALID JSON OBJECT (no explanation). Use French for textual fields. Ensure suggestedMeals array contains 2-3 realistic meals with numeric calories (>50) and protein >0, and fill top-level fields like healthScore, recommendedWater. Here is the original instruction and user context:\n" + originalPrompt + "\nUserContext:\n" + (userContext==null?"{}":userContext) + "\nNow produce the corrected JSON.";

        try {
            String retryResp = chatLanguageModel.generate(retryPrompt);
            retryResp = cleanResponse(retryResp);
            // If still invalid, throw
            String attempt = retryResp.trim();
            if (!attempt.startsWith("{")) {
                int idx = attempt.indexOf('{');
                if (idx >= 0) attempt = attempt.substring(idx);
            }
            com.fasterxml.jackson.databind.ObjectMapper mapper2 = new com.fasterxml.jackson.databind.ObjectMapper();
            Map<String,Object> map2 = mapper2.readValue(attempt, new com.fasterxml.jackson.core.type.TypeReference<Map<String,Object>>(){});
            // basic sanity: suggestedMeals or healthScore
            if (map2.containsKey("suggestedMeals") || map2.containsKey("healthScore")) {
                return retryResp;
            }
        } catch (Exception re) {
            log.warn("Retry attempt failed to produce valid JSON", re);
        }

        throw new Exception("AI response validation failed after retry");
    }
}
