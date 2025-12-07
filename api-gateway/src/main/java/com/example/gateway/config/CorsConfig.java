package com.example.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration corsConfig = new CorsConfiguration();

        // Utiliser allowedOriginPatterns au lieu de allowedOrigins pour compatibilité avec credentials
        corsConfig.setAllowedOriginPatterns(Arrays.asList("*"));

        // Méthodes HTTP autorisées
        corsConfig.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));

        // Headers autorisés
        corsConfig.setAllowedHeaders(List.of("*"));

        // Permettre les credentials (cookies, authorization headers)
        corsConfig.setAllowCredentials(true);

        // Durée de cache de la préflight request
        corsConfig.setMaxAge(3600L);

        // Exposer les headers dans la réponse
        corsConfig.setExposedHeaders(Arrays.asList("Authorization", "X-User-Id"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfig);

        return new CorsWebFilter(source);
    }
}

