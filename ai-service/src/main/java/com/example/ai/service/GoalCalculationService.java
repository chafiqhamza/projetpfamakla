package com.example.ai.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Service de calcul intelligent des objectifs nutritionnels
 * BasÃ© sur le profil utilisateur et les recommandations scientifiques
 */
@Service
public class GoalCalculationService {


    private static final Logger log = LoggerFactory.getLogger(GoalCalculationService.class);
    // Niveaux d'activitÃ© et leurs multiplicateurs
    private static final Map<String, Double> ACTIVITY_MULTIPLIERS = Map.of(
        "SEDENTARY", 1.2,      // Peu ou pas d'exercice
        "LIGHT", 1.375,        // Exercice lÃ©ger 1-3 jours/semaine
        "MODERATE", 1.55,      // Exercice modÃ©rÃ© 3-5 jours/semaine
        "ACTIVE", 1.725,       // Exercice intense 6-7 jours/semaine
        "VERY_ACTIVE", 1.9     // Exercice trÃ¨s intense + travail physique
    );

    // Recommandations pour les conditions de santÃ©
    private static final int DIABETIC_CARB_LIMIT = 130; // grammes par jour (ADA)
    private static final int DIABETIC_CARB_MAX = 150;
    private static final int HYPERTENSION_SODIUM_LIMIT = 2300; // mg par jour

    /**
     * Calcule les objectifs nutritionnels personnalisÃ©s
     */
    public Map<String, Object> calculatePersonalizedGoals(Map<String, Object> userProfile) {
        try {
            // Extraire les donnÃ©es du profil
            int age = getIntValue(userProfile, "age", 30);
            double weight = getDoubleValue(userProfile, "weight", 70.0);
            double height = getDoubleValue(userProfile, "height", 170.0);
            String gender = getStringValue(userProfile, "gender", "MALE");
            String activityLevel = getStringValue(userProfile, "activityLevel", "MODERATE");
            List<String> healthConditions = getListValue(userProfile, "healthConditions");
            List<String> goals = getListValue(userProfile, "goals");

            // Calculer le mÃ©tabolisme de base (BMR) avec Mifflin-St Jeor
            double bmr = calculateBMR(weight, height, age, gender);

            // Calculer les besoins caloriques totaux (TDEE)
            double tdee = calculateTDEE(bmr, activityLevel);

            // Ajuster selon les objectifs (perte/gain de poids)
            int calorieGoal = adjustCaloriesForGoals(tdee, goals);

            // Calculer les macronutriments
            Map<String, Integer> macros = calculateMacros(calorieGoal, healthConditions);

            // Calculer l'hydratation
            int waterGoal = calculateWaterGoal(weight, activityLevel);

            // Calculer les micronutriments importants
            Map<String, Integer> micronutrients = calculateMicronutrients(weight, age, gender, healthConditions);

            // Construire la rÃ©ponse
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("caloriesGoal", calorieGoal);
            result.put("waterGoal", waterGoal);
            result.put("carbsGoal", macros.get("carbs"));
            result.put("proteinGoal", macros.get("protein"));
            result.put("fatGoal", macros.get("fat"));
            result.put("fiberGoal", macros.get("fiber"));
            result.put("micronutrients", micronutrients);
            result.put("bmr", Math.round(bmr));
            result.put("tdee", Math.round(tdee));
            result.put("calculationMethod", "Mifflin-St Jeor + Activity Adjustment");
            result.put("recommendations", generateRecommendations(userProfile, healthConditions));

            log.info("Calculated personalized goals for user: BMR={}, TDEE={}, Calories={}",
                     Math.round(bmr), Math.round(tdee), calorieGoal);

            return result;

        } catch (Exception e) {
            log.error("Error calculating personalized goals", e);
            return getDefaultGoals();
        }
    }

    /**
     * Calcule le mÃ©tabolisme de base (BMR) avec la formule de Mifflin-St Jeor
     */
    private double calculateBMR(double weight, double height, int age, String gender) {
        // Formule de Mifflin-St Jeor (plus prÃ©cise que Harris-Benedict)
        double bmr = 10 * weight + 6.25 * height - 5 * age;

        if (gender.equalsIgnoreCase("MALE")) {
            bmr += 5;
        } else {
            bmr -= 161;
        }

        return bmr;
    }

    /**
     * Calcule les besoins caloriques totaux (TDEE)
     */
    private double calculateTDEE(double bmr, String activityLevel) {
        double multiplier = ACTIVITY_MULTIPLIERS.getOrDefault(
            activityLevel.toUpperCase(), 1.55);
        return bmr * multiplier;
    }

    /**
     * Ajuste les calories selon les objectifs
     */
    private int adjustCaloriesForGoals(double tdee, List<String> goals) {
        double adjustedTdee = tdee;

        for (String goal : goals) {
            String upperGoal = goal.toUpperCase();

            if (upperGoal.contains("WEIGHT_LOSS") || upperGoal.contains("PERTE")) {
                // DÃ©ficit de 500 kcal/jour = -0.5kg/semaine
                adjustedTdee -= 500;
            } else if (upperGoal.contains("WEIGHT_GAIN") || upperGoal.contains("PRISE")) {
                // Surplus de 500 kcal/jour = +0.5kg/semaine
                adjustedTdee += 500;
            } else if (upperGoal.contains("MUSCLE") || upperGoal.contains("MUSCULAIRE")) {
                // LÃ©ger surplus pour la croissance musculaire
                adjustedTdee += 300;
            }
        }

        // Limites de sÃ©curitÃ©
        int finalCalories = (int) Math.round(adjustedTdee);
        return Math.max(1200, Math.min(4000, finalCalories));
    }

    /**
     * Calcule la rÃ©partition des macronutriments
     */
    private Map<String, Integer> calculateMacros(int calories, List<String> healthConditions) {
        Map<String, Integer> macros = new HashMap<>();

        boolean isDiabetic = healthConditions.stream()
            .anyMatch(c -> c.toUpperCase().contains("DIABET"));

        if (isDiabetic) {
            // RÃ©gime diabÃ©tique : glucides limitÃ©s
            macros.put("carbs", Math.min(DIABETIC_CARB_LIMIT, (int) (calories * 0.40 / 4)));
            macros.put("protein", (int) (calories * 0.25 / 4)); // 25% protÃ©ines
            macros.put("fat", (int) (calories * 0.35 / 9)); // 35% lipides
            macros.put("fiber", 35); // Plus de fibres pour contrÃ´ler la glycÃ©mie
        } else {
            // RÃ©gime standard
            macros.put("carbs", (int) (calories * 0.50 / 4)); // 50% glucides
            macros.put("protein", (int) (calories * 0.20 / 4)); // 20% protÃ©ines
            macros.put("fat", (int) (calories * 0.30 / 9)); // 30% lipides
            macros.put("fiber", 30);
        }

        return macros;
    }

    /**
     * Calcule l'objectif d'hydratation
     */
    private int calculateWaterGoal(double weight, String activityLevel) {
        // Base : 35ml par kg de poids corporel
        int baseWater = (int) (weight * 35);

        // Ajustement selon l'activitÃ©
        double multiplier = switch (activityLevel.toUpperCase()) {
            case "SEDENTARY" -> 1.0;
            case "LIGHT" -> 1.15;
            case "MODERATE" -> 1.25;
            case "ACTIVE" -> 1.4;
            case "VERY_ACTIVE" -> 1.6;
            default -> 1.25;
        };

        int waterGoal = (int) (baseWater * multiplier);

        // Limites de sÃ©curitÃ© : 1500-4000ml
        return Math.max(1500, Math.min(4000, waterGoal));
    }

    /**
     * Calcule les besoins en micronutriments
     */
    private Map<String, Integer> calculateMicronutrients(double weight, int age, String gender, List<String> healthConditions) {
        Map<String, Integer> micros = new HashMap<>();

        // ProtÃ©ines (en grammes)
        micros.put("protein", (int) (weight * 1.0)); // 1g par kg de poids

        // Sodium (mg) - rÃ©duit si hypertension
        boolean hasHypertension = healthConditions.stream()
            .anyMatch(c -> c.toUpperCase().contains("HYPERTENSION"));
        micros.put("sodium", hasHypertension ? 1500 : 2300);

        // Calcium (mg)
        micros.put("calcium", age > 50 ? 1200 : 1000);

        // Fer (mg)
        boolean isFemale = gender.equalsIgnoreCase("FEMALE");
        micros.put("iron", isFemale && age < 50 ? 18 : 8);

        // Vitamine D (IU)
        micros.put("vitaminD", age > 70 ? 800 : 600);

        return micros;
    }

    /**
     * GÃ©nÃ¨re des recommandations personnalisÃ©es
     */
    private List<String> generateRecommendations(Map<String, Object> profile, List<String> healthConditions) {
        List<String> recommendations = new ArrayList<>();

        boolean isDiabetic = healthConditions.stream()
            .anyMatch(c -> c.toUpperCase().contains("DIABET"));

        if (isDiabetic) {
            recommendations.add("ðŸ©º RÃ©gime adaptÃ© au diabÃ¨te : limitez les glucides Ã  130g/jour");
            recommendations.add("ðŸž PrivilÃ©giez les glucides Ã  index glycÃ©mique bas (lÃ©gumes, lÃ©gumineuses)");
            recommendations.add("ðŸ“Š Surveillez votre glycÃ©mie rÃ©guliÃ¨rement, surtout aprÃ¨s les repas");
            recommendations.add("ðŸ¥— Incluez des fibres (35g/jour) pour stabiliser la glycÃ©mie");
        }

        List<String> goals = getListValue(profile, "goals");
        for (String goal : goals) {
            if (goal.toUpperCase().contains("WEIGHT_LOSS")) {
                recommendations.add("âš–ï¸ DÃ©ficit calorique de 500 kcal/jour pour une perte saine");
                recommendations.add("ðŸƒ Combinez avec 30 minutes d'activitÃ© physique par jour");
            } else if (goal.toUpperCase().contains("MUSCLE")) {
                recommendations.add("ðŸ’ª Augmentez votre apport en protÃ©ines (1.6-2.2g/kg)");
                recommendations.add("ðŸ‹ï¸ EntraÃ®nement en rÃ©sistance 3-4 fois par semaine recommandÃ©");
            }
        }

        return recommendations;
    }

    /**
     * Objectifs par dÃ©faut en cas d'erreur
     */
    private Map<String, Object> getDefaultGoals() {
        Map<String, Object> defaults = new HashMap<>();
        defaults.put("success", false);
        defaults.put("caloriesGoal", 2000);
        defaults.put("waterGoal", 2500);
        defaults.put("carbsGoal", 250);
        defaults.put("proteinGoal", 60);
        defaults.put("fatGoal", 65);
        defaults.put("fiberGoal", 30);
        defaults.put("message", "Using default goals. Please update your profile for personalized recommendations.");
        return defaults;
    }

    // MÃ©thodes utilitaires

    private int getIntValue(Map<String, Object> map, String key, int defaultValue) {
        Object value = map.get(key);
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        return defaultValue;
    }

    private double getDoubleValue(Map<String, Object> map, String key, double defaultValue) {
        Object value = map.get(key);
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        return defaultValue;
    }

    private String getStringValue(Map<String, Object> map, String key, String defaultValue) {
        Object value = map.get(key);
        return value != null ? value.toString() : defaultValue;
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

