package com.example.ai.config;

import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.ollama.OllamaChatModel;
import dev.langchain4j.model.output.Response;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
import java.util.List;

@Configuration
public class AiConfig {

    @Value("${langchain4j.ollama.chat-model.base-url:http://localhost:11434}")
    private String ollamaBaseUrl;

    @Value("${langchain4j.ollama.chat-model.model-name:phi3}")
    private String modelName;

    @Value("${langchain4j.ollama.chat-model.temperature:0.7}")
    private Double temperature;

    @Bean
    public ChatLanguageModel chatLanguageModel() {
        try {
            return OllamaChatModel.builder()
                    .baseUrl(ollamaBaseUrl)
                    .modelName(modelName)
                    .temperature(temperature)
                    .timeout(Duration.ofSeconds(60))
                    .build();
        } catch (Exception e) {
            // Return a fallback implementation if Ollama is not available
            return new FallbackChatModel();
        }
    }

    // Fallback implementation when Ollama/Phi3 is not available
    private static class FallbackChatModel implements ChatLanguageModel {

        private final String fallbackMessage = "Hello! I'm Phi3, your nutrition assistant. I'm currently running in fallback mode. " +
                "Please ensure Ollama is installed and running with the phi3 model. " +
                "You can install it by running: 'ollama pull phi3' and 'ollama serve'. " +
                "In the meantime, I can still provide basic nutrition guidance!";

        @Override
        public String generate(String userMessage) {
            return fallbackMessage;
        }

        @Override
        public Response<AiMessage> generate(List<ChatMessage> messages) {
            AiMessage aiMessage = AiMessage.from(fallbackMessage);
            return Response.from(aiMessage);
        }
    }
}
