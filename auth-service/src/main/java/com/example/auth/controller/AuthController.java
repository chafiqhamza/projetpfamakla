package com.example.auth.controller;

import com.example.auth.dto.AuthResponse;
import com.example.auth.dto.LoginRequest;
import com.example.auth.dto.RegisterRequest;
import com.example.auth.model.User;
import com.example.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") // Pour permettre l'accès depuis n'importe quelle origine
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/validate")
    public ResponseEntity<User> validateToken(@RequestHeader("Authorization") String token) {
        // Remove "Bearer " prefix
        String jwtToken = token.substring(7);
        User user = authService.validateToken(jwtToken);
        return ResponseEntity.ok(user);
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Auth Service is running");
    }

    // Endpoint pour lister tous les utilisateurs (DEVELOPPEMENT UNIQUEMENT)
    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        List<User> users = authService.getAllUsers();

        // Transformer les users en Map pour ne pas exposer le mot de passe
        List<Map<String, Object>> userDtos = users.stream().map(user -> {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id", user.getId());
            dto.put("username", user.getUsername());
            dto.put("email", user.getEmail());
            dto.put("firstName", user.getFirstName());
            dto.put("lastName", user.getLastName());
            dto.put("role", user.getRole().toString());
            dto.put("enabled", user.isEnabled());
            dto.put("createdAt", user.getCreatedAt());
            return dto;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(userDtos);
    }
}
