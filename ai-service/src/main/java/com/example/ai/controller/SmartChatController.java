package com.example.ai.controller;

import com.example.ai.service.SmartChatService;
import org.springframework.web.bind.annotation.*;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Map;

@RestController
@RequestMapping("/api/smart")
@CrossOrigin("*")
public class SmartChatController {

    private final SmartChatService smartChatService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public SmartChatController(
            SmartChatService smartChatService
    ) {
        this.smartChatService = smartChatService;
    }

    /**
     * Smart chat endpoint with intent detection
     */
    @PostMapping("/chat")
    public Map<String, Object> chat(@RequestBody Map<String, Object> request) {
        String message = (String) request.get("message");
        Object contextObj = request.get("context");
        String context = null;
        if (contextObj != null) {
            try {
                context = objectMapper.writeValueAsString(contextObj);
            } catch (Exception e) {
                context = contextObj.toString();
            }
        }

        return smartChatService.smartChat(message, context);
    }

    /**
     * Generate nutrition diagnostic report
     */
    @PostMapping("/diagnostic")
    public Map<String, String> generateDiagnostic(@RequestBody Map<String, Object> request) {
        Object userDataObj = request.get("userData");
        String userData = userDataObj != null ? userDataObj.toString() : "No data available";

        String report = smartChatService.generateDiagnostic(userData);
        return Map.of("report", report);
    }
}
