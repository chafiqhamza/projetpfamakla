-- Script d'initialisation de la base de données PostgreSQL pour Makla Auth Service
-- SELECT * FROM users;
-- Vérification

-- VALUES ('admin', 'admin@makla.com', '$2a$10$...', 'Admin', 'User', 'ADMIN', true, CURRENT_TIMESTAMP);
-- INSERT INTO users (username, email, password, first_name, last_name, role, enabled, created_at)
-- Le mot de passe sera hashé par BCrypt dans l'application
-- Insertion d'un utilisateur de test (mot de passe: "password123")

*/
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

);
    updated_at TIMESTAMP
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    enabled BOOLEAN NOT NULL DEFAULT true,
    role VARCHAR(50) NOT NULL DEFAULT 'USER',
    last_name VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    id BIGSERIAL PRIMARY KEY,
CREATE TABLE IF NOT EXISTS users (
/*

-- Mais voici le schéma pour référence:
-- La table users sera créée automatiquement par Hibernate avec ddl-auto=update

-- \c makladb
-- Connexion à la base makladb

-- CREATE DATABASE makladb;
-- Création de la base de données (à exécuter en tant que superuser)

-- Exécuter ce script après avoir créé la base de données

