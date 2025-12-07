package com.example.notification.service;

import com.example.notification.dto.Notification;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    public void sendNotification(Long userId, String type, String title, String message) {
        Notification notification = Notification.builder()
                .id(UUID.randomUUID().toString())
                .userId(userId)
                .type(type)
                .title(title)
                .message(message)
                .timestamp(LocalDateTime.now())
                .read(false)
                .build();

        // Envoyer via WebSocket
        messagingTemplate.convertAndSend("/topic/notifications/" + userId, notification);
    }

    public void sendWaterReminder(Long userId) {
        sendNotification(userId, "WATER_REMINDER",
                "Hydratation",
                "N'oubliez pas de boire de l'eau ! 💧");
    }

    public void sendMealReminder(Long userId, String mealType) {
        sendNotification(userId, "MEAL_REMINDER",
                "Repas",
                "C'est l'heure de votre " + mealType + " ! 🍽️");
    }

    public void sendGoalAchieved(Long userId, String goalType) {
        sendNotification(userId, "GOAL_ACHIEVED",
                "Objectif atteint",
                "Félicitations ! Vous avez atteint votre objectif de " + goalType + " ! 🎉");
    }
}

