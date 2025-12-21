package com.example.ai.service;

import dev.langchain4j.data.document.Document;
import dev.langchain4j.data.document.Metadata;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.embedding.onnx.allminilml6v2.AllMiniLmL6V2EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.inmemory.InMemoryEmbeddingStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service de gestion de la base de connaissances nutritionnelle avec RAG
 * Charge et indexe les documents pour la recherche sÃ©mantique
 */
@Service
public class NutritionKnowledgeService {


    private static final Logger log = LoggerFactory.getLogger(NutritionKnowledgeService.class);
    private final EmbeddingModel embeddingModel;
    private final EmbeddingStore<TextSegment> embeddingStore;

    public NutritionKnowledgeService() {
        // Initialisation du modèle d'embeddings (local, pas besoin de serveur)
        this.embeddingModel = new AllMiniLmL6V2EmbeddingModel();

        // Store en mémoire (peut être remplacé par une base vectorielle persistante)
        this.embeddingStore = new InMemoryEmbeddingStore<>();
    }

    /**
     * Initialisation au démarrage : charge immédiatement le fallback puis charge les fichiers en arrière-plan
     * Démarrage rapide : 2-3 secondes au lieu de bloquer
     */
    @PostConstruct
    public void initialize() {
        log.info("Loading basic nutrition knowledge (fast startup)...");

        // Charger immédiatement les connaissances de base pour un démarrage rapide
        try {
            loadFallbackKnowledge();
            log.info("Basic knowledge loaded - Service ready!");
        } catch (Exception e) {
            log.error("Failed to load basic knowledge", e);
        }

        // Charger les fichiers complets en arrière-plan (non-bloquant)
        Thread loadingThread = new Thread(() -> {
            try {
                log.info("Loading full nutrition knowledge base in background...");
                Thread.sleep(2000); // Attendre 2 secondes pour laisser l'app démarrer complètement
                loadNutritionKnowledge();
                log.info("========================================");
                log.info("✅ FULL KNOWLEDGE BASE LOADED!");
                log.info("========================================");
                log.info("AI Service is now fully operational");
                log.info("Total segments indexed: {}", getIndexedSegmentsCount());
                log.info("========================================");
            } catch (Exception e) {
                log.warn("Could not load full knowledge base, using basic knowledge: {}", e.getMessage());
            }
        });
        loadingThread.setDaemon(true); // Thread daemon pour ne pas bloquer l'arrêt de l'app
        loadingThread.start();
    }

    /**
     * Charge les documents nutritionnels depuis les ressources
     */
    private void loadNutritionKnowledge() {
        log.info("Attempting to load knowledge files from resources...");

        // Liste des catégories à charger (supporte plusieurs noms de fichiers)
        String[] categories = {
            "nutrition-basics",
            "diabetic-guidelines",
            "food-database",
            "meal-recipes",
            "diabete",
            "nutrition-generale",
            "recettes-saines",
            "conditions-medicales"
        };

        int loadedCount = 0;
        for (String category : categories) {
            try {
                if (loadKnowledgeCategory(category, "Nutrition: " + category)) {
                    loadedCount++;
                }
            } catch (Exception e) {
                log.debug("Could not load category {}: {}", category, e.getMessage());
            }
        }

        log.info("Loaded {} knowledge categories from files", loadedCount);

        if (loadedCount == 0) {
            log.warn("No knowledge files loaded - using fallback knowledge only");
        } else {
            log.info("========================================");
            log.info("AI SERVICE READY AND OPERATIONAL!");
            log.info("========================================");
            log.info("Endpoints available:");
            log.info("  - Chat RAG:     POST http://localhost:8087/api/chat/rag");
            log.info("  - Agent Goals:  POST http://localhost:8087/api/agent/calculate-goals");
            log.info("  - Analyze:      POST http://localhost:8087/api/agent/analyze-profile");
            log.info("========================================");
        }
    }

    /**
     * Charge une catégorie spécifique de connaissances
     * @return true si le chargement a réussi, false sinon
     */
    private boolean loadKnowledgeCategory(String category, String description) {
        try {
            String resourcePath = "knowledge/" + category + ".txt";
            InputStream inputStream = getClass().getClassLoader().getResourceAsStream(resourcePath);

            if (inputStream != null) {
                String content;
                try (inputStream) {
                    content = new String(inputStream.readAllBytes());
                }

                if (content.trim().isEmpty()) {
                    log.debug("Empty file: {}", resourcePath);
                    return false;
                }

                // Découper le contenu en segments (simple split par paragraphes)
                List<TextSegment> segments = splitIntoSegments(content, category, description);

                if (segments.isEmpty()) {
                    log.debug("No segments created from: {}", resourcePath);
                    return false;
                }

                log.info("Processing {} segments from {} (generating embeddings)...", segments.size(), category);

                // Générer les embeddings par lots pour éviter le blocage
                int batchSize = 20;
                int totalProcessed = 0;

                for (int start = 0; start < segments.size(); start += batchSize) {
                    int end = Math.min(start + batchSize, segments.size());
                    List<TextSegment> batch = segments.subList(start, end);

                    // Générer les embeddings pour ce lot
                    List<Embedding> embeddings = embeddingModel.embedAll(batch).content();

                    // Stocker dans le vector store
                    for (int i = 0; i < batch.size(); i++) {
                        embeddingStore.add(embeddings.get(i), batch.get(i));
                    }

                    totalProcessed += batch.size();
                    if (segments.size() > batchSize) {
                        log.info("  Progress: {}/{} segments embedded", totalProcessed, segments.size());
                    }
                }

                log.info("✓ Loaded {} segments from: {}", segments.size(), category);
                return true;
            } else {
                log.debug("Resource not found: {}", resourcePath);
                return false;
            }
        } catch (Exception e) {
            log.debug("Error loading category {}: {}", category, e.getMessage());
            return false;
        }
    }

    /**
     * Découpe un texte en segments pour l'indexation
     * Simple split par paragraphes et limitation à 1000 caractères max
     */
    private List<TextSegment> splitIntoSegments(String content, String category, String description) {
        List<TextSegment> segments = new ArrayList<>();

        // Split par double saut de ligne (paragraphes)
        String[] paragraphs = content.split("\\n\\s*\\n");

        for (String paragraph : paragraphs) {
            paragraph = paragraph.trim();
            if (paragraph.isEmpty()) {
                continue;
            }

            // Si le paragraphe est trop long, le découper en morceaux
            if (paragraph.length() > 1000) {
                // Découper par phrases (approximatif)
                String[] sentences = paragraph.split("\\. ");
                StringBuilder chunk = new StringBuilder();

                for (String sentence : sentences) {
                    if (chunk.length() + sentence.length() > 1000) {
                        if (chunk.length() > 0) {
                            Metadata metadata = new Metadata();
                            metadata.put("category", category);
                            metadata.put("description", description);
                            segments.add(TextSegment.from(chunk.toString().trim(), metadata));
                            chunk = new StringBuilder();
                        }
                    }
                    chunk.append(sentence).append(". ");
                }

                if (chunk.length() > 0) {
                    Metadata metadata = new Metadata();
                    metadata.put("category", category);
                    metadata.put("description", description);
                    segments.add(TextSegment.from(chunk.toString().trim(), metadata));
                }
            } else {
                Metadata metadata = new Metadata();
                metadata.put("category", category);
                metadata.put("description", description);
                segments.add(TextSegment.from(paragraph, metadata));
            }
        }

        return segments;
    }

    /**
     * Charge des connaissances de base en cas d'Ã©chec du chargement principal
     */
    private void loadFallbackKnowledge() {
        log.info("Loading fallback nutrition knowledge...");

        List<String> fallbackKnowledge = List.of(
            "Les macronutriments principaux sont les glucides, les protÃ©ines et les lipides. " +
            "Les glucides fournissent 4 calories par gramme, les protÃ©ines 4 calories par gramme, " +
            "et les lipides 9 calories par gramme.",

            "Pour les personnes diabÃ©tiques, il est recommandÃ© de limiter l'apport en glucides " +
            "Ã  environ 130g par jour selon l'ADA (American Diabetes Association). " +
            "PrivilÃ©giez les glucides complexes Ã  index glycÃ©mique bas.",

            "L'hydratation est essentielle. Un adulte devrait consommer entre 2000 et 3000ml d'eau par jour, " +
            "selon le niveau d'activitÃ© physique. Les besoins augmentent avec l'exercice et la chaleur.",

            "Les besoins caloriques quotidiens varient selon l'Ã¢ge, le sexe, le poids et le niveau d'activitÃ©. " +
            "Pour calculer le mÃ©tabolisme de base (BMR), on utilise souvent la formule de Mifflin-St Jeor: " +
            "Hommes: BMR = 10 Ã— poids(kg) + 6.25 Ã— taille(cm) - 5 Ã— Ã¢ge + 5. " +
            "Femmes: BMR = 10 Ã— poids(kg) + 6.25 Ã— taille(cm) - 5 Ã— Ã¢ge - 161.",

            "Pour perdre du poids de maniÃ¨re saine, un dÃ©ficit calorique de 500 calories par jour " +
            "permet une perte d'environ 0.5kg par semaine. Pour prendre du poids, un surplus de 500 calories est recommandÃ©.",

            "Les aliments riches en fibres aident Ã  contrÃ´ler la glycÃ©mie et favorisent la satiÃ©tÃ©. " +
            "Objectif: 25-30g de fibres par jour. Sources: lÃ©gumes, fruits, lÃ©gumineuses, cÃ©rÃ©ales complÃ¨tes.",

            "Les protÃ©ines sont essentielles pour la construction musculaire et la rÃ©cupÃ©ration. " +
            "Recommandation: 0.8-1.2g de protÃ©ines par kg de poids corporel. " +
            "Pour les sportifs: 1.6-2.2g par kg.",

            "Les repas diabÃ©tiques doivent Ãªtre Ã©quilibrÃ©s: 45-65% de glucides complexes, " +
            "20-35% de lipides sains, et 10-35% de protÃ©ines. Ã‰vitez les sucres simples et les aliments transformÃ©s."
        );

        for (String knowledge : fallbackKnowledge) {
            TextSegment segment = TextSegment.from(knowledge);
            Embedding embedding = embeddingModel.embed(segment).content();
            embeddingStore.add(embedding, segment);
        }

        log.info("Loaded {} fallback knowledge segments", fallbackKnowledge.size());
    }

    /**
     * Recherche sÃ©mantique dans la base de connaissances
     * @param query RequÃªte de l'utilisateur
     * @param maxResults Nombre maximum de rÃ©sultats
     * @return Liste des segments pertinents
     */
    public List<String> searchKnowledge(String query, int maxResults) {
        try {
            // GÃ©nÃ©rer l'embedding de la requÃªte
            Embedding queryEmbedding = embeddingModel.embed(query).content();

            // Rechercher les segments les plus pertinents
            List<EmbeddingMatch<TextSegment>> matches = embeddingStore.findRelevant(queryEmbedding, maxResults);

            // Extraire le texte des segments
            return matches.stream()
                .map(match -> match.embedded().text())
                .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Error searching knowledge base", e);
            return new ArrayList<>();
        }
    }

    /**
     * Recherche avec score de pertinence minimum
     */
    public List<String> searchKnowledgeWithThreshold(String query, int maxResults, double minScore) {
        try {
            Embedding queryEmbedding = embeddingModel.embed(query).content();
            List<EmbeddingMatch<TextSegment>> matches = embeddingStore.findRelevant(queryEmbedding, maxResults, minScore);

            return matches.stream()
                .map(match -> match.embedded().text())
                .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Error searching knowledge base with threshold", e);
            return new ArrayList<>();
        }
    }

    /**
     * Ajoute un nouveau document Ã  la base de connaissances
     * Utile pour l'ingestion dynamique
     */
    public void ingestDocument(String content, String category) {
        try {
            // Utiliser notre méthode de split manuelle
            List<TextSegment> segments = splitIntoSegments(content, category, "Dynamically ingested");
            List<Embedding> embeddings = embeddingModel.embedAll(segments).content();

            for (int i = 0; i < segments.size(); i++) {
                embeddingStore.add(embeddings.get(i), segments.get(i));
            }

            log.info("Ingested {} new segments for category: {}", segments.size(), category);
        } catch (Exception e) {
            log.error("Error ingesting document", e);
        }
    }

    /**
     * Retourne le nombre de segments indexés dans le store
     */
    private int getIndexedSegmentsCount() {
        try {
            // Faire une recherche fictive pour obtenir tous les segments
            Embedding dummyEmbedding = embeddingModel.embed("test").content();
            List<EmbeddingMatch<TextSegment>> allMatches = embeddingStore.findRelevant(dummyEmbedding, 1000);
            return allMatches.size();
        } catch (Exception e) {
            return 0;
        }
    }

    /**
     * Retourne des statistiques sur la base de connaissances
     */
    public Map<String, Object> getStatistics() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("status", "active");
        stats.put("embeddingModel", "all-MiniLM-L6-v2");
        stats.put("storeType", "in-memory");
        stats.put("indexedSegments", getIndexedSegmentsCount());
        return stats;
    }
}

