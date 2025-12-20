package com.example.water.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WaterIntakeRequest {
    private Integer amountMl;
    private LocalDateTime intakeTime;
    private String notes;

    // Getters and Setters
    public Integer getAmountMl() { return amountMl; }
    public void setAmountMl(Integer amountMl) { this.amountMl = amountMl; }

    public LocalDateTime getIntakeTime() { return intakeTime; }
    public void setIntakeTime(LocalDateTime intakeTime) { this.intakeTime = intakeTime; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}

