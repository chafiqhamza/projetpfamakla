package com.example.water.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        // Permettre les origines spécifiques (pas "*" pour éviter les problèmes avec credentials)
        config.setAllowedOriginPatterns(Arrays.asList("*")); // Utiliser allowedOriginPatterns au lieu de allowedOrigins

        // Permettre tous les headers
        config.setAllowedHeaders(Arrays.asList("*"));

        // Permettre toutes les méthodes HTTP
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));

        // Permettre les credentials (cookies, authorization headers, etc.)
        config.setAllowCredentials(true);

        // Durée de cache de la préflight request (en secondes)
        config.setMaxAge(3600L);

        // Exposer certains headers dans la réponse
        config.setExposedHeaders(Arrays.asList("Authorization", "X-User-Id"));

        // Appliquer cette configuration à tous les endpoints
        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }
}

