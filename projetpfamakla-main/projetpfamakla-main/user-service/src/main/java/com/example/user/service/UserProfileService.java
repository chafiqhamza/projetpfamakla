package com.example.user.service;

import com.example.user.dto.UserProfileRequest;
import com.example.user.model.UserProfile;
import com.example.user.repository.UserProfileRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class UserProfileService {

    private final UserProfileRepository userProfileRepository;

    public UserProfileService(UserProfileRepository userProfileRepository) {
        this.userProfileRepository = userProfileRepository;
    }

    public UserProfile createProfile(UserProfileRequest request) {
        UserProfile profile = new UserProfile();
        profile.setAuthUserId(request.getAuthUserId());
        profile.setEmail(request.getEmail());
        profile.setCreatedAt(LocalDateTime.now());

        // Set profile details
        if (request.getDateOfBirth() != null) {
            profile.setDateOfBirth(request.getDateOfBirth());
        }
        if (request.getGender() != null) {
            profile.setGender(UserProfile.Gender.valueOf(request.getGender()));
        }
        if (request.getHeight() != null) {
            profile.setHeight(request.getHeight());
        }
        if (request.getCurrentWeight() != null) {
            profile.setCurrentWeight(request.getCurrentWeight());
        }
        if (request.getTargetWeight() != null) {
            profile.setTargetWeight(request.getTargetWeight());
        }
        if (request.getActivityLevel() != null) {
            profile.setActivityLevel(UserProfile.ActivityLevel.valueOf(request.getActivityLevel()));
        }
        if (request.getGoal() != null) {
            profile.setGoal(UserProfile.Goal.valueOf(request.getGoal()));
        }

        // Calculate daily targets
        calculateDailyTargets(profile);

        return userProfileRepository.save(profile);
    }

    private void calculateDailyTargets(UserProfile profile) {
        if (profile.getCurrentWeight() == null || profile.getHeight() == null ||
            profile.getDateOfBirth() == null || profile.getGender() == null) {
            return;
        }

        // Calculate BMR using Mifflin-St Jeor
        int age = calculateAge(profile.getDateOfBirth());
        double bmr = calculateBMR(profile.getCurrentWeight(), profile.getHeight(), age, profile.getGender());

        // Apply activity level multiplier
        double tdee = applyActivityMultiplier(bmr, profile.getActivityLevel());

        // Adjust based on goal
        int dailyCalories = adjustCaloriesForGoal(tdee, profile.getGoal());
        profile.setDailyCalorieTarget(dailyCalories);

        // Set macro targets
        double proteinPercentage = 0.25; // 25% of calories
        double fatPercentage = 0.35; // 35% of calories
        double carbsPercentage = 0.40; // 40% of calories

        profile.setDailyProteinTarget((dailyCalories * proteinPercentage) / 4);
        profile.setDailyFatTarget((dailyCalories * fatPercentage) / 9);
        profile.setDailyCarbsTarget((dailyCalories * carbsPercentage) / 4);

        // Set daily water target (35ml per kg)
        profile.setDailyWaterTarget((int) (profile.getCurrentWeight() * 35));
    }

    private int calculateAge(java.time.LocalDate dateOfBirth) {
        return (int) java.time.temporal.ChronoUnit.YEARS.between(dateOfBirth, java.time.LocalDate.now());
    }

    private double calculateBMR(double weight, double height, int age, UserProfile.Gender gender) {
        if (gender == UserProfile.Gender.MALE) {
            return (10 * weight) + (6.25 * height) - (5 * age) + 5;
        } else {
            return (10 * weight) + (6.25 * height) - (5 * age) - 161;
        }
    }

    private double applyActivityMultiplier(double bmr, UserProfile.ActivityLevel level) {
        if (level == null) {
            return bmr * 1.2;
        }
        switch (level) {
            case SEDENTARY:
                return bmr * 1.2;
            case LIGHTLY_ACTIVE:
                return bmr * 1.375;
            case MODERATELY_ACTIVE:
                return bmr * 1.55;
            case VERY_ACTIVE:
                return bmr * 1.725;
            case EXTREMELY_ACTIVE:
                return bmr * 1.9;
            default:
                return bmr * 1.2;
        }
    }

    private int adjustCaloriesForGoal(double tdee, UserProfile.Goal goal) {
        if (goal == null) {
            return (int) tdee;
        }
        switch (goal) {
            case LOSE_WEIGHT:
                return (int) (tdee * 0.85); // 15% deficit
            case GAIN_WEIGHT:
                return (int) (tdee * 1.15); // 15% surplus
            case BUILD_MUSCLE:
                return (int) (tdee * 1.1); // 10% surplus
            case MAINTAIN_WEIGHT:
            default:
                return (int) tdee;
        }
    }

    public UserProfile getProfile(Long authUserId) {
        return userProfileRepository.findByAuthUserId(authUserId)
                .orElseThrow(() -> new RuntimeException("Profile not found"));
    }

    public UserProfile updateProfile(Long authUserId, UserProfileRequest request) {
        UserProfile profile = getProfile(authUserId);
        profile.setEmail(request.getEmail());
        profile.setDateOfBirth(request.getDateOfBirth());
        if (request.getGender() != null) {
            profile.setGender(UserProfile.Gender.valueOf(request.getGender()));
        }
        profile.setHeight(request.getHeight());
        profile.setCurrentWeight(request.getCurrentWeight());
        profile.setTargetWeight(request.getTargetWeight());
        if (request.getActivityLevel() != null) {
            profile.setActivityLevel(UserProfile.ActivityLevel.valueOf(request.getActivityLevel()));
        }
        if (request.getGoal() != null) {
            profile.setGoal(UserProfile.Goal.valueOf(request.getGoal()));
        }
        profile.setUpdatedAt(LocalDateTime.now());
        calculateDailyTargets(profile);
        return userProfileRepository.save(profile);
    }
}
