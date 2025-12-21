package com.example.ai.controller;

import com.example.ai.service.NutritionGoalAgentService;
import com.example.ai.service.NutritionKnowledgeService;
import com.example.ai.service.RagChatService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * ContrÃ´leur pour le chat avec RAG et l'agent de gestion des objectifs
 */
@RestController
@RequestMapping("/api")
@CrossOrigin("*")
public class RagChatController {


    private static final Logger log = LoggerFactory.getLogger(RagChatController.class);
    private final RagChatService ragChatService;
    private final NutritionGoalAgentService goalAgentService;
    private final NutritionKnowledgeService knowledgeService;


    public RagChatController(
            RagChatService ragChatService,
            NutritionGoalAgentService goalAgentService,
            NutritionKnowledgeService knowledgeService
    ) {
        this.ragChatService = ragChatService;
        this.goalAgentService = goalAgentService;
        this.knowledgeService = knowledgeService;
    }
    /**
     * Chat avec RAG activÃ©
     */
    @PostMapping("/chat/rag")
    public Map<String, Object> chatWithRag(@RequestBody Map<String, Object> request) {
        try {
            String message = (String) request.get("message");
            String context = request.containsKey("context") ?
                           request.get("context").toString() : null;

            log.info("RAG chat request received: {}", message);

            // Chat avec dÃ©tection d'intention
            Map<String, Object> response = ragChatService.chatWithIntentDetection(message, context);

            return Map.of(
                "success", true,
                "response", response.get("response"),
                "intent", response.get("intent"),
                "requiresUserChoice", response.get("requiresUserChoice"),
                "suggestedActions", response.get("suggestedActions")
            );

        } catch (Exception e) {
            log.error("Error in RAG chat", e);
            return Map.of(
                "success", false,
                "error", e.getMessage(),
                "response", "DÃ©solÃ©, une erreur s'est produite. Veuillez rÃ©essayer."
            );
        }
    }

    /**
     * Analyse le profil et suggÃ¨re de nouveaux objectifs
     */
    @PostMapping("/agent/analyze-profile")
    public Map<String, Object> analyzeProfile(@RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> userProfile = (Map<String, Object>) request.get("userProfile");

            @SuppressWarnings("unchecked")
            Map<String, Object> currentData = (Map<String, Object>) request.getOrDefault("currentData", Map.of());

            log.info("Agent analyzing profile for user: {}", userProfile.get("userId"));

            Map<String, Object> analysis = goalAgentService.analyzeProfileAndSuggestGoals(userProfile, currentData);

            return analysis;

        } catch (Exception e) {
            log.error("Error analyzing profile", e);
            return Map.of(
                "success", false,
                "error", "Failed to analyze profile: " + e.getMessage()
            );
        }
    }

    /**
     * Met Ã  jour les objectifs avec confirmation utilisateur
     */
    @PostMapping("/agent/update-goals")
    public Map<String, Object> updateGoals(@RequestBody Map<String, Object> request) {
        try {
            String userId = (String) request.get("userId");

            @SuppressWarnings("unchecked")
            Map<String, Object> newGoals = (Map<String, Object>) request.get("newGoals");

            boolean userAccepted = (boolean) request.getOrDefault("accepted", false);
            String userFeedback = (String) request.getOrDefault("feedback", "");

            log.info("Updating goals for user {}: accepted={}", userId, userAccepted);

            Map<String, Object> result = goalAgentService.updateGoalsWithUserConfirmation(
                userId, newGoals, userAccepted, userFeedback
            );

            return result;

        } catch (Exception e) {
            log.error("Error updating goals", e);
            return Map.of(
                "success", false,
                "error", "Failed to update goals: " + e.getMessage()
            );
        }
    }

    /**
     * Analyse contextuelle quotidienne
     */
    @PostMapping("/agent/daily-analysis")
    public Map<String, Object> dailyAnalysis(@RequestBody Map<String, Object> request) {
        try {
            String userId = (String) request.get("userId");

            @SuppressWarnings("unchecked")
            Map<String, Object> todayData = (Map<String, Object>) request.get("todayData");

            Map<String, Object> analysis = goalAgentService.dailyContextAnalysis(userId, todayData);

            return analysis;

        } catch (Exception e) {
            log.error("Error in daily analysis", e);
            return Map.of(
                "success", false,
                "error", e.getMessage()
            );
        }
    }

    /**
     * Obtient l'historique des dÃ©cisions de l'agent
     */
    @GetMapping("/agent/history/{userId}")
    public Map<String, Object> getAgentHistory(@PathVariable String userId) {
        try {
            List<Map<String, Object>> history = goalAgentService.getAgentHistory(userId);

            return Map.of(
                "success", true,
                "userId", userId,
                "history", history
            );

        } catch (Exception e) {
            log.error("Error retrieving agent history", e);
            return Map.of(
                "success", false,
                "error", e.getMessage()
            );
        }
    }

    /**
     * Ingestion de nouveaux documents dans la base de connaissances
     */
    @PostMapping("/knowledge/ingest")
    public Map<String, Object> ingestKnowledge(@RequestBody Map<String, Object> request) {
        try {
            String content = (String) request.get("content");
            String category = (String) request.getOrDefault("category", "general");

            knowledgeService.ingestDocument(content, category);

            return Map.of(
                "success", true,
                "message", "Document ingested successfully",
                "category", category
            );

        } catch (Exception e) {
            log.error("Error ingesting knowledge", e);
            return Map.of(
                "success", false,
                "error", e.getMessage()
            );
        }
    }

    /**
     * Recherche dans la base de connaissances
     */
    @PostMapping("/knowledge/search")
    public Map<String, Object> searchKnowledge(@RequestBody Map<String, Object> request) {
        try {
            String query = (String) request.get("query");
            int maxResults = (int) request.getOrDefault("maxResults", 5);

            List<String> results = knowledgeService.searchKnowledge(query, maxResults);

            return Map.of(
                "success", true,
                "query", query,
                "results", results,
                "count", results.size()
            );

        } catch (Exception e) {
            log.error("Error searching knowledge", e);
            return Map.of(
                "success", false,
                "error", e.getMessage()
            );
        }
    }

    /**
     * Statistiques de la base de connaissances
     */
    @GetMapping("/knowledge/stats")
    public Map<String, Object> getKnowledgeStats() {
        try {
            return knowledgeService.getStatistics();
        } catch (Exception e) {
            log.error("Error retrieving knowledge stats", e);
            return Map.of(
                "success", false,
                "error", e.getMessage()
            );
        }
    }
}

