package com.example.water.service;

import com.example.water.dto.WaterGoalRequest;
import com.example.water.dto.WaterIntakeRequest;
import com.example.water.dto.WaterSummaryResponse;
import com.example.water.model.WaterGoal;
import com.example.water.model.WaterIntake;
import com.example.water.repository.WaterGoalRepository;
import com.example.water.repository.WaterIntakeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
public class WaterService {

    private final WaterIntakeRepository waterIntakeRepository;
    private final WaterGoalRepository waterGoalRepository;

    // Constructor manuel pour remplacer @RequiredArgsConstructor
    public WaterService(WaterIntakeRepository waterIntakeRepository,
                        WaterGoalRepository waterGoalRepository) {
        this.waterIntakeRepository = waterIntakeRepository;
        this.waterGoalRepository = waterGoalRepository;
    }

    @Transactional
    public WaterIntake addWaterIntake(Long userId, WaterIntakeRequest request) {
        WaterIntake intake = new WaterIntake();
        intake.setUserId(userId);
        intake.setAmountMl(request.getAmountMl());
        intake.setIntakeTime(request.getIntakeTime() != null ? request.getIntakeTime() : LocalDateTime.now());
        intake.setNotes(request.getNotes());
        return waterIntakeRepository.save(intake);
    }

    public List<WaterIntake> getUserWaterIntake(Long userId) {
        return waterIntakeRepository.findByUserIdOrderByIntakeTimeDesc(userId);
    }

    public List<WaterIntake> getUserWaterIntakeForDate(Long userId, LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.atTime(LocalTime.MAX);
        return waterIntakeRepository.findByUserIdAndIntakeTimeBetweenOrderByIntakeTimeDesc(
                userId, start, end);
    }

    public WaterSummaryResponse getDailySummary(Long userId, LocalDate date) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }
        if (date == null) {
            date = LocalDate.now();
        }

        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.atTime(LocalTime.MAX);

        Integer totalMl = waterIntakeRepository.getTotalIntakeForPeriod(userId, start, end);
        if (totalMl == null) totalMl = 0;

        WaterGoal goal = waterGoalRepository.findByUserId(userId).orElse(null);
        Integer goalMl = goal != null ? goal.getDailyGoalMl() : 2000; // Défaut: 2L

        Integer remainingMl = Math.max(0, goalMl - totalMl);
        Double percentage = goalMl > 0 ? (totalMl.doubleValue() / goalMl) * 100 : 0.0;

        List<WaterIntake> intakes = getUserWaterIntakeForDate(userId, date);

        WaterSummaryResponse response = new WaterSummaryResponse();
        response.setTotalMl(totalMl);
        response.setGoalMl(goalMl);
        response.setRemainingMl(remainingMl);
        response.setPercentageAchieved(percentage);
        response.setIntakeCount(intakes.size());
        return response;
    }

    @Transactional
    public WaterGoal setWaterGoal(Long userId, WaterGoalRequest request) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }
        if (request == null || request.getDailyGoalMl() == null || request.getDailyGoalMl() <= 0) {
            throw new IllegalArgumentException("Valid daily goal is required (must be positive)");
        }

        WaterGoal goal = waterGoalRepository.findByUserId(userId)
                .orElse(new WaterGoal());
        goal.setUserId(userId);
        goal.setDailyGoalMl(request.getDailyGoalMl());
        return waterGoalRepository.save(goal);
    }

    public WaterGoal getUserGoal(Long userId) {
        return waterGoalRepository.findByUserId(userId)
                .orElseGet(() -> {
                    WaterGoal defaultGoal = new WaterGoal();
                    defaultGoal.setUserId(userId);
                    defaultGoal.setDailyGoalMl(2000);
                    return defaultGoal;
                });
    }

    @Transactional
    public void deleteWaterIntake(Long id, Long userId) {
        WaterIntake intake = waterIntakeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Water intake not found"));
        if (!intake.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        waterIntakeRepository.delete(intake);
    }
}

