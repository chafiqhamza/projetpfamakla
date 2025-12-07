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
}

