package com.example.water.repository;

import com.example.water.model.WaterGoal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WaterGoalRepository extends JpaRepository<WaterGoal, Long> {
    Optional<WaterGoal> findByUserId(Long userId);
}

