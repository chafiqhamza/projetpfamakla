package com.example.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.web.server.WebFilter;
import reactor.core.publisher.SignalType;

import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration corsConfig = new CorsConfiguration();

        // Utiliser allowedOriginPatterns au lieu de allowedOrigins pour compatibilité avec credentials
        corsConfig.setAllowedOriginPatterns(List.of("*"));

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

    // Add a small WebFilter to normalize Access-Control-Allow-Origin header if multiple values are present
    @Bean
    public WebFilter normalizeCorsHeaderFilter() {
        // Use doFinally to ensure normalization runs regardless of success/error
        return (exchange, chain) -> chain.filter(exchange).doFinally((SignalType signal) -> {
            try {
                ServerHttpResponse response = exchange.getResponse();
                HttpHeaders headers = response.getHeaders();

                // Collect raw header values: could be multiple entries or a single comma-separated value
                List<String> origins = headers.get(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN);

                if (origins != null && !origins.isEmpty()) {
                    // Join all entries into one string and split on commas to get the first origin
                    String joined = String.join(",", origins);
                    String first = joined.split(",")[0].trim();
                    if (!first.isEmpty()) {
                        headers.set(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, first);
                    }
                }
            } catch (Exception ignored) {
                // best-effort normalization, ignore failures
            }
        });
    }
}
