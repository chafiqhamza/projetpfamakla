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

    // OPÉRATIONS COMPLEXES AVEC POSTGRESQL

    public Object getWaterStatistics(Long userId) {
        List<WaterIntake> intakes = waterIntakeRepository.findByUserId(userId);
        WaterGoal goal = getUserGoal(userId);

        int totalIntakes = intakes.size();
        int totalMl = intakes.stream().mapToInt(WaterIntake::getAmountMl).sum();
        double avgPerDay = totalMl / (double) (intakes.isEmpty() ? 1 :
            java.time.temporal.ChronoUnit.DAYS.between(
                intakes.stream().map(WaterIntake::getIntakeTime).min(LocalDateTime::compareTo).orElse(LocalDateTime.now()).toLocalDate(),
                LocalDate.now()
            ) + 1);

        return new WaterStatistics(
            totalIntakes,
            totalMl,
            avgPerDay,
            goal.getDailyGoalMl(),
            (avgPerDay / goal.getDailyGoalMl()) * 100
        );
    }

    public Object getWeeklyStatistics(Long userId) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(7);

        List<WaterIntake> intakes = waterIntakeRepository.findByUserIdAndIntakeTimeBetween(
            userId,
            startDate.atStartOfDay(),
            endDate.atTime(23, 59, 59)
        );

        WaterGoal goal = getUserGoal(userId);
        int totalMl = intakes.stream().mapToInt(WaterIntake::getAmountMl).sum();
        double avgPerDay = totalMl / 7.0;

        return new WeeklyStatistics(
            intakes.size(),
            totalMl,
            avgPerDay,
            goal.getDailyGoalMl(),
            startDate,
            endDate
        );
    }

    public Object getMonthlyStatistics(Long userId) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(30);

        List<WaterIntake> intakes = waterIntakeRepository.findByUserIdAndIntakeTimeBetween(
            userId,
            startDate.atStartOfDay(),
            endDate.atTime(23, 59, 59)
        );

        int totalMl = intakes.stream().mapToInt(WaterIntake::getAmountMl).sum();
        WaterGoal goal = getUserGoal(userId);

        return new MonthlyStatistics(
            intakes.size(),
            totalMl,
            totalMl / 30.0,
            goal.getDailyGoalMl(),
            startDate,
            endDate
        );
    }

    public Object getHydrationTrends(Long userId, int days) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days - 1);

        List<WaterIntake> intakes = waterIntakeRepository.findByUserIdAndIntakeTimeBetween(
            userId,
            startDate.atStartOfDay(),
            endDate.atTime(23, 59, 59)
        );

        var dailyData = new java.util.ArrayList<DailyHydration>();

        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            final LocalDate currentDate = date;
            int dayTotal = intakes.stream()
                .filter(i -> i.getIntakeTime().toLocalDate().equals(currentDate))
                .mapToInt(WaterIntake::getAmountMl)
                .sum();

            dailyData.add(new DailyHydration(currentDate, dayTotal));
        }

        return dailyData;
    }

    public Object getGoalCompletionRate(Long userId) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(30);
        WaterGoal goal = getUserGoal(userId);

        List<WaterIntake> intakes = waterIntakeRepository.findByUserIdAndIntakeTimeBetween(
            userId,
            startDate.atStartOfDay(),
            endDate.atTime(23, 59, 59)
        );

        var dailyTotals = intakes.stream()
            .collect(java.util.stream.Collectors.groupingBy(
                i -> i.getIntakeTime().toLocalDate(),
                java.util.stream.Collectors.summingInt(WaterIntake::getAmountMl)
            ));

        long daysMetGoal = dailyTotals.values().stream()
            .filter(total -> total >= goal.getDailyGoalMl())
            .count();

        return new GoalCompletion(
            (int) daysMetGoal,
            30,
            (daysMetGoal / 30.0) * 100
        );
    }

    public Object getHourlyDistribution(Long userId) {
        List<WaterIntake> intakes = waterIntakeRepository.findByUserId(userId);

        return intakes.stream()
            .collect(java.util.stream.Collectors.groupingBy(
                i -> i.getIntakeTime().getHour(),
                java.util.stream.Collectors.summingInt(WaterIntake::getAmountMl)
            ))
            .entrySet().stream()
            .sorted(java.util.Map.Entry.comparingByKey())
            .collect(java.util.stream.Collectors.toMap(
                e -> e.getKey() + ":00",
                java.util.Map.Entry::getValue,
                (a, b) -> a,
                java.util.LinkedHashMap::new
            ));
    }

    public Object getWeeklyComparison(Long userId) {
        LocalDate now = LocalDate.now();
        LocalDate thisWeekStart = now.minusDays(7);
        LocalDate lastWeekStart = now.minusDays(14);

        List<WaterIntake> thisWeek = waterIntakeRepository.findByUserIdAndIntakeTimeBetween(
            userId, thisWeekStart.atStartOfDay(), now.atTime(23, 59, 59)
        );

        List<WaterIntake> lastWeek = waterIntakeRepository.findByUserIdAndIntakeTimeBetween(
            userId, lastWeekStart.atStartOfDay(), thisWeekStart.minusDays(1).atTime(23, 59, 59)
        );

        int thisWeekTotal = thisWeek.stream().mapToInt(WaterIntake::getAmountMl).sum();
        int lastWeekTotal = lastWeek.stream().mapToInt(WaterIntake::getAmountMl).sum();
        double change = lastWeekTotal > 0 ? ((thisWeekTotal - lastWeekTotal) / (double) lastWeekTotal) * 100 : 0;

        return new WeeklyComparison(
            thisWeekTotal,
            lastWeekTotal,
            change,
            thisWeek.size(),
            lastWeek.size()
        );
    }

    public Object getHydrationStreaks(Long userId) {
        WaterGoal goal = getUserGoal(userId);
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(90);

        List<WaterIntake> intakes = waterIntakeRepository.findByUserIdAndIntakeTimeBetween(
            userId,
            startDate.atStartOfDay(),
            endDate.atTime(23, 59, 59)
        );

        var dailyTotals = intakes.stream()
            .collect(java.util.stream.Collectors.groupingBy(
                i -> i.getIntakeTime().toLocalDate(),
                java.util.stream.Collectors.summingInt(WaterIntake::getAmountMl)
            ));

        int currentStreak = 0;
        int longestStreak = 0;
        int tempStreak = 0;

        for (LocalDate date = endDate; !date.isBefore(startDate); date = date.minusDays(1)) {
            if (dailyTotals.getOrDefault(date, 0) >= goal.getDailyGoalMl()) {
                tempStreak++;
                if (date.equals(endDate) || currentStreak > 0) {
                    currentStreak = tempStreak;
                }
                longestStreak = Math.max(longestStreak, tempStreak);
            } else {
                tempStreak = 0;
            }
        }

        return new HydrationStreaks(currentStreak, longestStreak);
    }

    public Object getBestHydrationDays(Long userId, int days) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days - 1);

        List<WaterIntake> intakes = waterIntakeRepository.findByUserIdAndIntakeTimeBetween(
            userId,
            startDate.atStartOfDay(),
            endDate.atTime(23, 59, 59)
        );

        return intakes.stream()
            .collect(java.util.stream.Collectors.groupingBy(
                i -> i.getIntakeTime().toLocalDate(),
                java.util.stream.Collectors.summingInt(WaterIntake::getAmountMl)
            ))
            .entrySet().stream()
            .sorted((a, b) -> Integer.compare(b.getValue(), a.getValue()))
            .limit(10)
            .map(e -> new BestDay(e.getKey(), e.getValue()))
            .toList();
    }

    // Records pour les réponses
    record WaterStatistics(int totalIntakes, int totalMl, double avgPerDay,
                          int dailyGoal, double goalCompletionPercent) {}

    record WeeklyStatistics(int totalIntakes, int totalMl, double avgPerDay,
                           int dailyGoal, LocalDate startDate, LocalDate endDate) {}

    record MonthlyStatistics(int totalIntakes, int totalMl, double avgPerDay,
                            int dailyGoal, LocalDate startDate, LocalDate endDate) {}

    record DailyHydration(LocalDate date, int totalMl) {}

    record GoalCompletion(int daysMetGoal, int totalDays, double completionRate) {}

    record WeeklyComparison(int thisWeekTotal, int lastWeekTotal, double percentChange,
                           int thisWeekIntakes, int lastWeekIntakes) {}

    record HydrationStreaks(int currentStreak, int longestStreak) {}

    record BestDay(LocalDate date, int totalMl) {}
}

