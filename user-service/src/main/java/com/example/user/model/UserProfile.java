package com.example.user.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_profiles")
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long authUserId;

    @Column(nullable = false)
    private String email;

    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    private Gender gender;

    private Double height;
    private Double currentWeight;
    private Double targetWeight;

    @Enumerated(EnumType.STRING)
    private ActivityLevel activityLevel;

    @Enumerated(EnumType.STRING)
    private Goal goal;

    private Integer dailyCalorieTarget;
    private Double dailyProteinTarget;
    private Double dailyCarbsTarget;
    private Double dailyFatTarget;
    private Integer dailyWaterTarget;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt;

    public UserProfile() {
    }

    public UserProfile(Long authUserId, String email) {
        this.authUserId = authUserId;
        this.email = email;
    }

    // Getters
    public Long getId() {
        return id;
    }

    public Long getAuthUserId() {
        return authUserId;
    }

    public String getEmail() {
        return email;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public Gender getGender() {
        return gender;
    }

    public Double getHeight() {
        return height;
    }

    public Double getCurrentWeight() {
        return currentWeight;
    }

    public Double getTargetWeight() {
        return targetWeight;
    }

    public ActivityLevel getActivityLevel() {
        return activityLevel;
    }

    public Goal getGoal() {
        return goal;
    }

    public Integer getDailyCalorieTarget() {
        return dailyCalorieTarget;
    }

    public Double getDailyProteinTarget() {
        return dailyProteinTarget;
    }

    public Double getDailyCarbsTarget() {
        return dailyCarbsTarget;
    }

    public Double getDailyFatTarget() {
        return dailyFatTarget;
    }

    public Integer getDailyWaterTarget() {
        return dailyWaterTarget;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    // Setters
    public void setId(Long id) {
        this.id = id;
    }

    public void setAuthUserId(Long authUserId) {
        this.authUserId = authUserId;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public void setGender(Gender gender) {
        this.gender = gender;
    }

    public void setHeight(Double height) {
        this.height = height;
    }

    public void setCurrentWeight(Double currentWeight) {
        this.currentWeight = currentWeight;
    }

    public void setTargetWeight(Double targetWeight) {
        this.targetWeight = targetWeight;
    }

    public void setActivityLevel(ActivityLevel activityLevel) {
        this.activityLevel = activityLevel;
    }

    public void setGoal(Goal goal) {
        this.goal = goal;
    }

    public void setDailyCalorieTarget(Integer dailyCalorieTarget) {
        this.dailyCalorieTarget = dailyCalorieTarget;
    }

    public void setDailyProteinTarget(Double dailyProteinTarget) {
        this.dailyProteinTarget = dailyProteinTarget;
    }

    public void setDailyCarbsTarget(Double dailyCarbsTarget) {
        this.dailyCarbsTarget = dailyCarbsTarget;
    }

    public void setDailyFatTarget(Double dailyFatTarget) {
        this.dailyFatTarget = dailyFatTarget;
    }

    public void setDailyWaterTarget(Integer dailyWaterTarget) {
        this.dailyWaterTarget = dailyWaterTarget;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public enum Gender {
        MALE, FEMALE, OTHER
    }

    public enum ActivityLevel {
        SEDENTARY, LIGHTLY_ACTIVE, MODERATELY_ACTIVE, VERY_ACTIVE, EXTREMELY_ACTIVE
    }

    public enum Goal {
        LOSE_WEIGHT, GAIN_WEIGHT, MAINTAIN_WEIGHT, BUILD_MUSCLE
    }
}

