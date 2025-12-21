package com.example.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {
    private String id;
    private Long userId;
    private String type;
    private String title;
    private String message;
    private LocalDateTime timestamp;
    private boolean read;
}

