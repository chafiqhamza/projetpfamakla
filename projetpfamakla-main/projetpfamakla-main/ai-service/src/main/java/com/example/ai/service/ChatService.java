package com.example.ai.service;

import dev.langchain4j.model.chat.ChatLanguageModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class ChatService {


    private static final Logger log = LoggerFactory.getLogger(ChatService.class);
    private final ChatLanguageModel chatLanguageModel;


    public ChatService(
            ChatLanguageModel chatLanguageModel
    ) {
        this.chatLanguageModel = chatLanguageModel;
    }
    public String chat(String message) {
        return chat(message, null);
    }

    public String chat(String message, String context) {
        StringBuilder promptBuilder = new StringBuilder();
        promptBuilder.append("You are Phi3, a helpful nutrition assistant for the Makla platform. ");
        promptBuilder.append("You help users track their meals, water intake, and provide health advice. ");
        promptBuilder.append("Respond in a friendly, concise manner. ");

        if (context != null && !context.isEmpty()) {
            promptBuilder.append("\n\nUser's current data:\n").append(context);
            promptBuilder.append("\n\nUse this data to provide personalized insights and recommendations.");
        }
        
        promptBuilder.append("\n\nUser: ").append(message);
        promptBuilder.append("\nPhi3: ");

        try {
            log.info("Sending message to Phi3 model: {}", message);
            String response = chatLanguageModel.generate(promptBuilder.toString());
            log.info("Received response from Phi3 model");

            // Clean up response if it contains the prompt echo
            if (response.startsWith("Phi3: ")) {
                response = response.substring(6).trim();
            }

            return response;
        } catch (Exception e) {
            log.error("Error communicating with Phi3 model: {}", e.getMessage());
            return "Hello! I'm Phi3, your nutrition assistant. I'm currently having trouble connecting to my AI model. " +
                   "Please make sure Ollama is running with the phi3 model installed. " +
                   "You can install it by running: 'ollama pull phi3' and 'ollama serve'. " +
                   "In the meantime, I can still provide basic nutrition guidance!";
        }
    }
}
