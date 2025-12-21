package com.example.notification.controller;

import com.example.notification.dto.Notification;
import com.example.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@Controller
@RequiredArgsConstructor
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class NotificationController {

    private final NotificationService notificationService;

    @MessageMapping("/notification")
    public void handleNotification(@Payload Notification notification) {
        notificationService.sendNotification(
                notification.getUserId(),
                notification.getType(),
                notification.getTitle(),
                notification.getMessage()
        );
    }

    @PostMapping("/api/notifications/water-reminder/{userId}")
    @ResponseBody
    public ResponseEntity<Void> sendWaterReminder(@PathVariable Long userId) {
        notificationService.sendWaterReminder(userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/api/notifications/meal-reminder/{userId}")
    @ResponseBody
    public ResponseEntity<Void> sendMealReminder(
            @PathVariable Long userId,
            @RequestParam String mealType) {
        notificationService.sendMealReminder(userId, mealType);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/api/notifications/goal-achieved/{userId}")
    @ResponseBody
    public ResponseEntity<Void> sendGoalAchieved(
            @PathVariable Long userId,
            @RequestParam String goalType) {
        notificationService.sendGoalAchieved(userId, goalType);
        return ResponseEntity.ok().build();
    }
}

