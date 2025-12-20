package com.example.food.service;

import com.example.food.model.Food;
import com.example.food.repository.FoodRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class FoodService {

    private final FoodRepository foodRepository;

    public FoodService(FoodRepository foodRepository) {
        this.foodRepository = foodRepository;
    }

    public Food createFood(Food food) {
        food.setId(null); // Ensure new entity
        food.setCreatedAt(LocalDateTime.now());

        return foodRepository.save(food);
    }

    public List<Food> getAllFoods() {
        return foodRepository.findAll();
    }

    public Food getFoodById(Long id) {
        return foodRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Food not found"));
    }

    public Food updateFood(Long id, Food updatedFood) {
        Food food = getFoodById(id);
        food.setName(updatedFood.getName());
        food.setDescription(updatedFood.getDescription());
        food.setCalories(updatedFood.getCalories());
        food.setProtein(updatedFood.getProtein());
        food.setCarbohydrates(updatedFood.getCarbohydrates());
        food.setFat(updatedFood.getFat());
        food.setFiber(updatedFood.getFiber());
        food.setSugar(updatedFood.getSugar());
        food.setSodium(updatedFood.getSodium());
        food.setUpdatedAt(LocalDateTime.now());

        return foodRepository.save(food);
    }

    public void deleteFood(Long id) {
        foodRepository.deleteById(id);
    }

    public List<Food> searchFoods(String name) {
        return foodRepository.findByNameContainingIgnoreCase(name);
    }
}

