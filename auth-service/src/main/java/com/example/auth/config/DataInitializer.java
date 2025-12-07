package com.example.auth.config;

import com.example.auth.model.Role;
import com.example.auth.model.User;
import com.example.auth.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            // Vérifier si des utilisateurs existent déjà
            if (userRepository.count() == 0) {
                System.out.println("========================================");
                System.out.println("Initialisation de la base de données...");
                System.out.println("========================================");

                // Créer un utilisateur admin
                User admin = new User();
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder.encode("password"));
                admin.setEmail("admin@makla.com");
                admin.setFirstName("Admin");
                admin.setLastName("Makla");
                admin.setRole(Role.ADMIN);
                admin.setEnabled(true);
                userRepository.save(admin);
                System.out.println("✅ Utilisateur ADMIN créé : admin / password");

                // Créer un utilisateur standard
                User user = new User();
                user.setUsername("user");
                user.setPassword(passwordEncoder.encode("password"));
                user.setEmail("user@makla.com");
                user.setFirstName("User");
                user.setLastName("Test");
                user.setRole(Role.USER);
                user.setEnabled(true);
                userRepository.save(user);
                System.out.println("✅ Utilisateur USER créé : user / password");

                // Créer un nutritionniste
                User nutritionist = new User();
                nutritionist.setUsername("nutritionist");
                nutritionist.setPassword(passwordEncoder.encode("password"));
                nutritionist.setEmail("nutritionist@makla.com");
                nutritionist.setFirstName("Marie");
                nutritionist.setLastName("Dupont");
                nutritionist.setRole(Role.NUTRITIONIST);
                nutritionist.setEnabled(true);
                userRepository.save(nutritionist);
                System.out.println("✅ Utilisateur NUTRITIONIST créé : nutritionist / password");

                System.out.println("========================================");
                System.out.println("Initialisation terminée !");
                System.out.println("========================================");
            } else {
                System.out.println("Base de données déjà initialisée (" + userRepository.count() + " utilisateurs)");
            }
        };
    }
}

