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
            meal.setMealType(Meal.MealType.valueOf(request.getMealType()));
        }
        meal.setFoodIds(request.getFoodIds());
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
            meal.setMealType(Meal.MealType.valueOf(request.getMealType()));
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
}

