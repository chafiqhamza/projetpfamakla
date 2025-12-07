package com.example.meal.repository;

import com.example.meal.model.Meal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MealRepository extends JpaRepository<Meal, Long> {
    List<Meal> findByAuthUserId(Long authUserId);
    List<Meal> findByAuthUserIdAndMealDate(Long authUserId, LocalDate mealDate);

    // REQUÊTES COMPLEXES AJOUTÉES
    List<Meal> findByAuthUserIdAndMealDateBetween(Long authUserId, LocalDate startDate, LocalDate endDate);

    @org.springframework.data.jpa.repository.Query(
        "SELECT m FROM Meal m WHERE m.authUserId = :userId " +
        "AND m.mealDate >= :startDate AND m.mealDate <= :endDate " +
        "ORDER BY m.mealDate DESC"
    )
    List<Meal> findMealsInPeriod(
        @org.springframework.data.repository.query.Param("userId") Long userId,
        @org.springframework.data.repository.query.Param("startDate") LocalDate startDate,
        @org.springframework.data.repository.query.Param("endDate") LocalDate endDate
    );

    @org.springframework.data.jpa.repository.Query(
        "SELECT m FROM Meal m WHERE m.authUserId = :userId " +
        "AND m.totalCalories > :minCalories " +
        "ORDER BY m.totalCalories DESC"
    )
    List<Meal> findHighCalorieMeals(
        @org.springframework.data.repository.query.Param("userId") Long userId,
        @org.springframework.data.repository.query.Param("minCalories") double minCalories
    );

    @org.springframework.data.jpa.repository.Query(
        "SELECT COUNT(m) FROM Meal m WHERE m.authUserId = :userId " +
        "AND m.mealDate = :date"
    )
    long countMealsByUserAndDate(
        @org.springframework.data.repository.query.Param("userId") Long userId,
        @org.springframework.data.repository.query.Param("date") LocalDate date
    );

    @org.springframework.data.jpa.repository.Query(
        "SELECT SUM(m.totalCalories) FROM Meal m WHERE m.authUserId = :userId " +
        "AND m.mealDate BETWEEN :startDate AND :endDate"
    )
    Double sumCaloriesInPeriod(
        @org.springframework.data.repository.query.Param("userId") Long userId,
        @org.springframework.data.repository.query.Param("startDate") LocalDate startDate,
        @org.springframework.data.repository.query.Param("endDate") LocalDate endDate
    );

    @org.springframework.data.jpa.repository.Query(
        "SELECT AVG(m.totalCalories) FROM Meal m WHERE m.authUserId = :userId"
    )
    Double getAverageCalories(@org.springframework.data.repository.query.Param("userId") Long userId);

    List<Meal> findTop10ByAuthUserIdOrderByCreatedAtDesc(Long authUserId);

    @org.springframework.data.jpa.repository.Query(
        "SELECT m.mealType, COUNT(m) FROM Meal m WHERE m.authUserId = :userId " +
        "GROUP BY m.mealType ORDER BY COUNT(m) DESC"
    )
    List<Object[]> getMealTypeStatistics(@org.springframework.data.repository.query.Param("userId") Long userId);
}

