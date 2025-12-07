package com.example.meal.dto;

import java.time.LocalDate;
import java.util.List;

public class MealRequest {
    private Long authUserId;
    private LocalDate mealDate;
    private String mealType;
    private List<Long> foodIds;

    public MealRequest() {
    }

    public MealRequest(Long authUserId, LocalDate mealDate) {
        this.authUserId = authUserId;
        this.mealDate = mealDate;
    }

    public Long getAuthUserId() {
        return authUserId;
    }

    public void setAuthUserId(Long authUserId) {
        this.authUserId = authUserId;
    }

    public LocalDate getMealDate() {
        return mealDate;
    }

    public void setMealDate(LocalDate mealDate) {
        this.mealDate = mealDate;
    }

    public String getMealType() {
        return mealType;
    }

    public void setMealType(String mealType) {
        this.mealType = mealType;
    }

    public List<Long> getFoodIds() {
        return foodIds;
    }

    public void setFoodIds(List<Long> foodIds) {
        this.foodIds = foodIds;
    }
}

