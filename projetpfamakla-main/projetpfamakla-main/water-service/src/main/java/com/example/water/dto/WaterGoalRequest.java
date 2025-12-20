package com.example.water.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WaterGoalRequest {
    private Integer dailyGoalMl;

    // Getters and Setters
    public Integer getDailyGoalMl() { return dailyGoalMl; }
    public void setDailyGoalMl(Integer dailyGoalMl) { this.dailyGoalMl = dailyGoalMl; }
}

