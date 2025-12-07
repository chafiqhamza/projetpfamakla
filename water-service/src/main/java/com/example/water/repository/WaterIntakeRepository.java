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

    List<WaterIntake> findByUserIdAndIntakeTimeBetweenOrderByIntakeTimeDesc(
            Long userId, LocalDateTime start, LocalDateTime end);

    @Query("SELECT SUM(w.amountMl) FROM WaterIntake w WHERE w.userId = :userId " +
           "AND w.intakeTime BETWEEN :start AND :end")
    Integer getTotalIntakeForPeriod(@Param("userId") Long userId,
                                     @Param("start") LocalDateTime start,
                                     @Param("end") LocalDateTime end);
}

