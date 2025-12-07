package com.example.water.repository;

import com.example.water.model.WaterIntake;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface WaterIntakeRepository extends JpaRepository<WaterIntake, Long> {
    List<WaterIntake> findByUserIdOrderByIntakeTimeDesc(Long userId);

    List<WaterIntake> findByUserId(Long userId);

    List<WaterIntake> findByUserIdAndIntakeTimeBetweenOrderByIntakeTimeDesc(
            Long userId, LocalDateTime start, LocalDateTime end);

    List<WaterIntake> findByUserIdAndIntakeTimeBetween(
            Long userId, LocalDateTime start, LocalDateTime end);

    @Query("SELECT SUM(w.amountMl) FROM WaterIntake w WHERE w.userId = :userId " +
           "AND w.intakeTime BETWEEN :start AND :end")
    Integer getTotalIntakeForPeriod(@Param("userId") Long userId,
                                     @Param("start") LocalDateTime start,
                                     @Param("end") LocalDateTime end);

    // REQUÊTES COMPLEXES AJOUTÉES

    @Query("SELECT AVG(daily.total) FROM " +
           "(SELECT DATE(w.intakeTime) as date, SUM(w.amountMl) as total " +
           "FROM WaterIntake w WHERE w.userId = :userId " +
           "GROUP BY DATE(w.intakeTime)) daily")
    Double getAverageDailyIntake(@Param("userId") Long userId);

    @Query("SELECT COUNT(DISTINCT DATE(w.intakeTime)) FROM WaterIntake w " +
           "WHERE w.userId = :userId AND w.intakeTime BETWEEN :start AND :end")
    long countDistinctDays(@Param("userId") Long userId,
                          @Param("start") LocalDateTime start,
                          @Param("end") LocalDateTime end);

    @Query("SELECT HOUR(w.intakeTime) as hour, SUM(w.amountMl) as total " +
           "FROM WaterIntake w WHERE w.userId = :userId " +
           "GROUP BY HOUR(w.intakeTime) ORDER BY hour")
    List<Object[]> getHourlyDistribution(@Param("userId") Long userId);

    @Query("SELECT DATE(w.intakeTime) as date, SUM(w.amountMl) as total " +
           "FROM WaterIntake w WHERE w.userId = :userId " +
           "AND w.intakeTime BETWEEN :start AND :end " +
           "GROUP BY DATE(w.intakeTime) ORDER BY total DESC")
    List<Object[]> getTopHydrationDays(@Param("userId") Long userId,
                                       @Param("start") LocalDateTime start,
                                       @Param("end") LocalDateTime end);

    @Query("SELECT MAX(w.amountMl) FROM WaterIntake w WHERE w.userId = :userId")
    Integer getMaxSingleIntake(@Param("userId") Long userId);

    @Query("SELECT MIN(w.amountMl) FROM WaterIntake w WHERE w.userId = :userId " +
           "AND w.amountMl > 0")
    Integer getMinSingleIntake(@Param("userId") Long userId);

    List<WaterIntake> findTop10ByUserIdOrderByAmountMlDesc(Long userId);

    @Query("SELECT COUNT(w) FROM WaterIntake w WHERE w.userId = :userId " +
           "AND DATE(w.intakeTime) = :date")
    long countIntakesForDay(@Param("userId") Long userId,
                           @Param("date") java.time.LocalDate date);
}

