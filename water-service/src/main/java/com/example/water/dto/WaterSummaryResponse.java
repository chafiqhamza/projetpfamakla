package com.example.water.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WaterSummaryResponse {
    private Integer totalMl;
    private Integer goalMl;
    private Integer remainingMl;
    private Double percentageAchieved;
    private Integer intakeCount;

    // Getters and Setters
    public Integer getTotalMl() { return totalMl; }
    public void setTotalMl(Integer totalMl) { this.totalMl = totalMl; }

    public Integer getGoalMl() { return goalMl; }
    public void setGoalMl(Integer goalMl) { this.goalMl = goalMl; }

    public Integer getRemainingMl() { return remainingMl; }
    public void setRemainingMl(Integer remainingMl) { this.remainingMl = remainingMl; }

    public Double getPercentageAchieved() { return percentageAchieved; }
    public void setPercentageAchieved(Double percentageAchieved) { this.percentageAchieved = percentageAchieved; }

    public Integer getIntakeCount() { return intakeCount; }
    public void setIntakeCount(Integer intakeCount) { this.intakeCount = intakeCount; }
}

