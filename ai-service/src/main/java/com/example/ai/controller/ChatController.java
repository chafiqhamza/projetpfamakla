package com.example.ai.controller;
import com.example.ai.service.ChatService;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@RestController
@RequestMapping("/api/chat")
@CrossOrigin("*")
public class ChatController {
    private final ChatService chatService;
    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }
    @PostMapping
    public Map<String, String> chat(@RequestBody Map<String, Object> request) {
        String message = (String) request.get("message");
        Object contextObj = request.get("context");
        String context = contextObj != null ? contextObj.toString() : null;
        String response = chatService.chat(message, context);
        return Map.of("response", response);
    }
}