package com.example.meal.service;

import com.example.meal.dto.MealRequest;
import com.example.meal.model.Meal;
import com.example.meal.repository.MealRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class MealService {

    private final MealRepository mealRepository;

    public MealService(MealRepository mealRepository) {
        this.mealRepository = mealRepository;
    }

    public List<Meal> getAllMeals() {
        return mealRepository.findAll();
    }

    public Meal createMeal(MealRequest request) {
        Meal meal = new Meal();
        meal.setAuthUserId(request.getAuthUserId());
        meal.setMealDate(request.getMealDate());
        if (request.getMealType() != null) {
            try {
                meal.setMealType(Meal.MealType.valueOf(request.getMealType().toUpperCase()));
            } catch (IllegalArgumentException e) {
                meal.setMealType(Meal.MealType.LUNCH); // Fallback
            }
        } else {
            meal.setMealType(Meal.MealType.LUNCH); // Default to LUNCH if not provided
        }
        meal.setFoodIds(request.getFoodIds());
        meal.setTotalCalories(request.getTotalCalories());
        meal.setTotalProtein(request.getTotalProtein());
        meal.setTotalCarbs(request.getTotalCarbs());
        meal.setTotalFat(request.getTotalFat());
        meal.setCreatedAt(LocalDateTime.now());

        return mealRepository.save(meal);
    }

    public List<Meal> getMealsByUserAndDate(Long authUserId, LocalDate mealDate) {
        return mealRepository.findByAuthUserIdAndMealDate(authUserId, mealDate);
    }

    public Meal getMealById(Long id) {
        return mealRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Meal not found"));
    }

    public Meal updateMeal(Long id, MealRequest request) {
        Meal meal = getMealById(id);
        meal.setMealDate(request.getMealDate());
        if (request.getMealType() != null) {
            try {
                meal.setMealType(Meal.MealType.valueOf(request.getMealType().toUpperCase()));
            } catch (IllegalArgumentException e) {
                // Keep existing or set default? usually keep existing if invalid, or fallback
                // Let's fallback to LUNCH for consistency with create
                meal.setMealType(Meal.MealType.LUNCH);
            }
        }
        meal.setFoodIds(request.getFoodIds());
        meal.setUpdatedAt(LocalDateTime.now());

        return mealRepository.save(meal);
    }

    public void deleteMeal(Long id) {
        mealRepository.deleteById(id);
    }

    public List<Meal> getUserMeals(Long authUserId) {
        return mealRepository.findByAuthUserId(authUserId);
    }

    // OPÉRATIONS COMPLEXES AVEC POSTGRESQL

    public Object getUserMealStatistics(Long userId) {
        List<Meal> meals = mealRepository.findByAuthUserId(userId);

        long totalMeals = meals.size();
        double avgCaloriesPerMeal = meals.stream()
                .mapToDouble(Meal::getTotalCalories)
                .average()
                .orElse(0.0);

        return new MealStatistics(
            totalMeals,
            avgCaloriesPerMeal,
            getTotalCalories(meals),
            meals.stream().filter(m -> m.getMealType() == Meal.MealType.BREAKFAST).count(),
            meals.stream().filter(m -> m.getMealType() == Meal.MealType.LUNCH).count(),
            meals.stream().filter(m -> m.getMealType() == Meal.MealType.DINNER).count(),
            meals.stream().filter(m -> m.getMealType() == Meal.MealType.SNACK).count()
        );
    }

    public Object getUserMealStatisticsByPeriod(Long userId, LocalDate startDate, LocalDate endDate) {
        List<Meal> meals = mealRepository.findByAuthUserIdAndMealDateBetween(userId, startDate, endDate);

        return new PeriodStatistics(
            meals.size(),
            getTotalCalories(meals),
            meals.stream().mapToDouble(Meal::getTotalCalories).average().orElse(0.0),
            startDate,
            endDate,
            java.time.temporal.ChronoUnit.DAYS.between(startDate, endDate) + 1
        );
    }

    public Object getDailyCaloriesForLastDays(Long userId, int days) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days - 1);

        List<Meal> meals = mealRepository.findByAuthUserIdAndMealDateBetween(userId, startDate, endDate);

        return meals.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                    Meal::getMealDate,
                    java.util.stream.Collectors.summingDouble(Meal::getTotalCalories)
                ));
    }

    public Object getAverageMacros(Long userId) {
        List<Meal> meals = mealRepository.findByAuthUserId(userId);

        return new MacroStatistics(
            meals.stream().mapToDouble(m -> m.getTotalProtein() != null ? m.getTotalProtein() : 0.0).average().orElse(0.0),
            meals.stream().mapToDouble(m -> m.getTotalCarbs() != null ? m.getTotalCarbs() : 0.0).average().orElse(0.0),
            meals.stream().mapToDouble(m -> m.getTotalFat() != null ? m.getTotalFat() : 0.0).average().orElse(0.0),
            meals.size()
        );
    }

    public Object getMostFrequentMealTypes(Long userId) {
        List<Meal> meals = mealRepository.findByAuthUserId(userId);

        return meals.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                    m -> m.getMealType() != null ? m.getMealType() : Meal.MealType.LUNCH,
                    java.util.stream.Collectors.counting()
                ))
                .entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .collect(java.util.stream.Collectors.toMap(
                    e -> e.getKey().toString(),
                    java.util.Map.Entry::getValue,
                    (a, b) -> a,
                    java.util.LinkedHashMap::new
                ));
    }

    public Object getWeeklyComparison(Long userId) {
        LocalDate now = LocalDate.now();
        LocalDate thisWeekStart = now.minusDays(7);
        LocalDate lastWeekStart = now.minusDays(14);

        List<Meal> thisWeek = mealRepository.findByAuthUserIdAndMealDateBetween(userId, thisWeekStart, now);
        List<Meal> lastWeek = mealRepository.findByAuthUserIdAndMealDateBetween(userId, lastWeekStart, thisWeekStart.minusDays(1));

        double thisWeekCalories = getTotalCalories(thisWeek);
        double lastWeekCalories = getTotalCalories(lastWeek);
        double change = lastWeekCalories > 0 ? ((thisWeekCalories - lastWeekCalories) / lastWeekCalories) * 100 : 0;

        return new WeeklyComparison(
            thisWeekCalories,
            lastWeekCalories,
            change,
            thisWeek.size(),
            lastWeek.size()
        );
    }

    public Object getNutritionTrends(Long userId, int days) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days - 1);

        List<Meal> meals = mealRepository.findByAuthUserIdAndMealDateBetween(userId, startDate, endDate);

        var dailyData = new java.util.ArrayList<DailyNutrition>();

        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            final LocalDate currentDate = date;
            List<Meal> dayMeals = meals.stream()
                    .filter(m -> m.getMealDate().equals(currentDate))
                    .toList();

            dailyData.add(new DailyNutrition(
                currentDate,
                getTotalCalories(dayMeals),
                dayMeals.stream().mapToDouble(m -> m.getTotalProtein() != null ? m.getTotalProtein() : 0.0).sum(),
                dayMeals.stream().mapToDouble(m -> m.getTotalCarbs() != null ? m.getTotalCarbs() : 0.0).sum(),
                dayMeals.stream().mapToDouble(m -> m.getTotalFat() != null ? m.getTotalFat() : 0.0).sum()
            ));
        }

        return dailyData;
    }

    private double getTotalCalories(List<Meal> meals) {
        return meals.stream().mapToDouble(Meal::getTotalCalories).sum();
    }

    // Classes internes pour les réponses
    record MealStatistics(long totalMeals, double avgCaloriesPerMeal, double totalCalories,
                         long breakfastCount, long lunchCount, long dinnerCount, long snackCount) {}

    record PeriodStatistics(long totalMeals, double totalCalories, double avgCalories,
                           LocalDate startDate, LocalDate endDate, long days) {}

    record MacroStatistics(double avgProtein, double avgCarbs, double avgFats, long mealCount) {}

    record WeeklyComparison(double thisWeekCalories, double lastWeekCalories, double percentChange,
                           long thisWeekMeals, long lastWeekMeals) {}

    record DailyNutrition(LocalDate date, double calories, double protein, double carbs, double fats) {}
}
