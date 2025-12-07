# STRUCTURE DU PROJET MAKLA

**Date**: 7 Décembre 2025  
**Type**: Application Microservices Spring Boot + Angular  
**Architecture**: Microservices avec Eureka, Gateway, PostgreSQL

---

## 📁 STRUCTURE COMPLETE DU PROJET

```
projetmakla/
│
├── 📄 pom.xml                          # POM parent Maven
├── 📄 mvnw                             # Maven Wrapper Unix
├── 📄 mvnw.cmd                         # Maven Wrapper Windows
├── 📄 .mvn/                            # Configuration Maven Wrapper
│
├── 📄 docker-compose.yml               # Configuration Docker
│
├── 📜 README.md                        # Documentation principale
├── 📜 GUIDE-INTELLIJ.md                # Guide IntelliJ IDEA
├── 📜 SCRIPTS-README.md                # Documentation des scripts
├── 📜 START-EVERYTHING-README.md       # Guide de démarrage
├── 📜 README-JAVA25-FIX.md             # Correctifs Java 25
├── 📜 CORRECTIONS-RAPPORT.md           # Rapport des corrections
├── 📜 AUTH-POSTGRESQL-GUIDE-COMPLET.md # Guide PostgreSQL
├── 📜 POSTGRESQL-CONFIGURATION-FINALE.md
├── 📜 DEMARRAGE-RAPIDE-POSTGRES.md
├── 📜 AUTH-LOGIN-REGISTER-RESUME.md
│
├── 🔧 menu.bat                         # Menu interactif Windows
├── 🔧 START-EVERYTHING.ps1             # Script de démarrage complet
├── 🔧 START-ALL-AUTO.ps1               # Démarrage automatique
├── 🔧 COMPILE-ALL.ps1                  # Compilation de tous les services
├── 🔧 FIX-ALL.ps1                      # Correctifs automatiques
├── 🔧 SETUP-POSTGRESQL.ps1             # Installation PostgreSQL
├── 🔧 voir-users.ps1                   # Script voir utilisateurs
│
├── 🌐 voir-users.html                  # Interface web admin utilisateurs
├── 📊 Makla-API.postman_collection.json # Collection Postman
│
├── 📁 eureka-server/                   # Service de découverte Eureka
│   ├── pom.xml
│   ├── Dockerfile
│   ├── src/
│   │   └── main/
│   │       ├── java/
│   │       │   └── com/example/eureka/
│   │       │       └── EurekaServerApplication.java
│   │       └── resources/
│   │           └── application.properties
│   └── target/
│       └── eureka-server-0.0.1-SNAPSHOT.jar
│
├── 📁 config-server/                   # Service de configuration
│   ├── pom.xml
│   ├── Dockerfile
│   ├── src/
│   │   └── main/
│   │       ├── java/
│   │       │   └── com/example/config/
│   │       │       └── ConfigServerApplication.java
│   │       └── resources/
│   │           └── application.properties
│   └── target/
│       └── config-server-0.0.1-SNAPSHOT.jar
│
├── 📁 api-gateway/                     # API Gateway (Spring Cloud Gateway)
│   ├── pom.xml
│   ├── Dockerfile
│   ├── src/
│   │   └── main/
│   │       ├── java/
│   │       │   └── com/example/gateway/
│   │       │       ├── ApiGatewayApplication.java
│   │       │       └── config/
│   │       │           ├── CorsConfig.java
│   │       │           └── GatewayConfig.java
│   │       └── resources/
│   │           └── application.properties
│   │               # Routes pour: Food, Meal, Water, User, Auth
│   └── target/
│       └── api-gateway-0.0.1-SNAPSHOT.jar
│
├── 📁 auth-service/                    # Service d'authentification (PostgreSQL)
│   ├── pom.xml
│   ├── Dockerfile
│   ├── src/
│   │   └── main/
│   │       ├── java/
│   │       │   └── com/example/auth/
│   │       │       ├── AuthServiceApplication.java
│   │       │       ├── config/
│   │       │       │   ├── CorsConfig.java
│   │       │       │   ├── JwtAuthenticationFilter.java
│   │       │       │   └── SecurityConfig.java
│   │       │       ├── controller/
│   │       │       │   └── AuthController.java
│   │       │       │       # Endpoints: /register, /login, /validate, /users
│   │       │       ├── dto/
│   │       │       │   ├── AuthRequest.java
│   │       │       │   ├── AuthResponse.java
│   │       │       │   ├── LoginRequest.java
│   │       │       │   └── RegisterRequest.java
│   │       │       ├── model/
│   │       │       │   ├── User.java
│   │       │       │   └── Role.java (USER, ADMIN, NUTRITIONIST)
│   │       │       ├── repository/
│   │       │       │   └── UserRepository.java
│   │       │       └── service/
│   │       │           ├── AuthService.java
│   │       │           └── JwtService.java
│   │       └── resources/
│   │           ├── application.properties (H2 par défaut)
│   │           ├── application-postgres.properties (PostgreSQL)
│   │           └── db-init.sql
│   └── target/
│       └── auth-service-0.0.1-SNAPSHOT.jar
│
├── 📁 user-service/                    # Service de gestion des utilisateurs
│   ├── pom.xml
│   ├── Dockerfile
│   ├── src/
│   │   └── main/
│   │       ├── java/
│   │       │   └── com/example/user/
│   │       │       ├── UserServiceApplication.java
│   │       │       ├── config/
│   │       │       │   └── CorsConfig.java
│   │       │       ├── controller/
│   │       │       │   └── UserController.java
│   │       │       ├── dto/
│   │       │       │   ├── UserRequest.java
│   │       │       │   └── UserResponse.java
│   │       │       ├── model/
│   │       │       │   └── User.java
│   │       │       ├── repository/
│   │       │       │   └── UserRepository.java
│   │       │       └── service/
│   │       │           └── UserService.java
│   │       └── resources/
│   │           └── application.properties
│   └── target/
│       └── user-service-0.0.1-SNAPSHOT.jar
│
├── 📁 food-service/                    # Service de gestion des aliments
│   ├── pom.xml
│   ├── Dockerfile
│   ├── src/
│   │   └── main/
│   │       ├── java/
│   │       │   └── com/example/food/
│   │       │       ├── FoodServiceApplication.java
│   │       │       ├── config/
│   │       │       │   └── CorsConfig.java
│   │       │       ├── controller/
│   │       │       │   └── FoodController.java
│   │       │       │       # CRUD: GET, POST, PUT, DELETE /api/foods
│   │       │       ├── dto/
│   │       │       │   ├── FoodRequest.java
│   │       │       │   └── FoodResponse.java
│   │       │       ├── model/
│   │       │       │   └── Food.java
│   │       │       │       # name, calories, protein, carbs, fat, etc.
│   │       │       ├── repository/
│   │       │       │   └── FoodRepository.java
│   │       │       └── service/
│   │       │           └── FoodService.java
│   │       └── resources/
│   │           └── application.properties
│   └── target/
│       └── food-service-0.0.1-SNAPSHOT.jar
│
├── 📁 meal-service/                    # Service de gestion des repas
│   ├── pom.xml
│   ├── Dockerfile
│   ├── src/
│   │   └── main/
│   │       ├── java/
│   │       │   └── com/example/meal/
│   │       │       ├── MealServiceApplication.java
│   │       │       ├── config/
│   │       │       │   └── CorsConfig.java
│   │       │       ├── controller/
│   │       │       │   └── MealController.java
│   │       │       │       # CRUD: GET, POST, PUT, DELETE /api/meals
│   │       │       ├── dto/
│   │       │       │   ├── MealRequest.java
│   │       │       │   └── MealResponse.java
│   │       │       ├── model/
│   │       │       │   └── Meal.java
│   │       │       │       # name, description, mealType, totalCalories, etc.
│   │       │       ├── repository/
│   │       │       │   └── MealRepository.java
│   │       │       └── service/
│   │       │           └── MealService.java
│   │       └── resources/
│   │           └── application.properties
│   └── target/
│       └── meal-service-0.0.1-SNAPSHOT.jar
│
├── 📁 water-service/                   # Service de suivi d'eau
│   ├── pom.xml
│   ├── Dockerfile
│   ├── src/
│   │   └── main/
│   │       ├── java/
│   │       │   └── com/example/water/
│   │       │       ├── WaterServiceApplication.java
│   │       │       ├── config/
│   │       │       │   └── CorsConfig.java
│   │       │       ├── controller/
│   │       │       │   └── WaterController.java
│   │       │       │       # GET, POST /api/water
│   │       │       │       # /intake, /goal, /summary
│   │       │       ├── dto/
│   │       │       │   ├── WaterIntakeRequest.java
│   │       │       │   ├── WaterGoalRequest.java
│   │       │       │   └── WaterSummaryResponse.java
│   │       │       ├── model/
│   │       │       │   ├── WaterIntake.java
│   │       │       │   └── WaterGoal.java
│   │       │       ├── repository/
│   │       │       │   ├── WaterIntakeRepository.java
│   │       │       │   └── WaterGoalRepository.java
│   │       │       └── service/
│   │       │           └── WaterService.java
│   │       └── resources/
│   │           └── application.properties
│   └── target/
│       └── water-service-0.0.1-SNAPSHOT.jar
│
├── 📁 nutrition-service/               # Service de nutrition (optionnel)
│   ├── pom.xml
│   └── src/
│       └── main/
│           ├── java/
│           │   └── com/example/nutrition/
│           │       └── NutritionServiceApplication.java
│           └── resources/
│               └── application.properties
│
├── 📁 notification-service/            # Service de notifications (optionnel)
│   ├── pom.xml
│   └── src/
│       └── main/
│           ├── java/
│           │   └── com/example/notification/
│           │       └── NotificationServiceApplication.java
│           └── resources/
│               └── application.properties
│
└── 📁 frontend/                        # Application Angular
    ├── package.json
    ├── package-lock.json
    ├── angular.json
    ├── tsconfig.json
    ├── tsconfig.app.json
    ├── test-api.html
    │
    ├── public/                         # Fichiers statiques
    │   └── favicon.ico
    │
    └── src/
        ├── index.html                  # Point d'entrée HTML
        ├── main.ts                     # Bootstrap Angular
        ├── styles.css                  # Styles globaux
        │
        ├── app/
        │   ├── app.component.ts        # Composant racine
        │   ├── app.component.html
        │   ├── app.component.css
        │   ├── app.config.ts           # Configuration application
        │   ├── app.routes.ts           # Routes Angular
        │   │
        │   ├── services/               # Services Angular
        │   │   ├── auth.service.ts     # Service d'authentification
        │   │   ├── food.service.ts     # Service aliments
        │   │   ├── meal.service.ts     # Service repas
        │   │   └── water.service.ts    # Service eau
        │   │
        │   └── pages/                  # Composants pages
        │       ├── home/
        │       │   └── home.component.ts
        │       ├── login/
        │       │   └── login.component.ts       # ✨ Page de connexion
        │       ├── register/
        │       │   └── register.component.ts    # ✨ Page d'inscription
        │       ├── foods/
        │       │   └── foods.component.ts       # Gestion aliments
        │       ├── meals/
        │       │   └── meals.component.ts       # Gestion repas
        │       ├── water/
        │       │   └── water.component.ts       # Suivi eau
        │       └── diagnostic/
        │           └── diagnostic.component.ts  # Diagnostic système
        │
        └── environments/
            ├── environment.ts          # Config développement
            └── environment.prod.ts     # Config production
```

---

## 🎯 PORTS DES SERVICES

| Service | Port | Health Check | Description |
|---------|------|-------------|-------------|
| **Eureka Server** | 8761 | `/actuator/health` | Service de découverte |
| **Config Server** | 8888 | `/actuator/health` | Configuration centralisée |
| **API Gateway** | 8080 | `/actuator/health` | Passerelle API |
| **Auth Service** | 8081 | `/actuator/health` | Authentification (PostgreSQL) |
| **User Service** | 8082 | `/actuator/health` | Gestion utilisateurs |
| **Food Service** | 8083 | `/api/foods/health` | Gestion aliments |
| **Meal Service** | 8084 | `/api/meals/health` | Gestion repas |
| **Water Service** | 8085 | `/api/water/health` | Suivi hydratation |
| **Frontend Angular** | 4200 | `http://localhost:4200` | Interface utilisateur |

---

## 🔗 ROUTES API GATEWAY

```
Gateway (8080) → Services

/api/foods/**   → FOOD-SERVICE (8083)
/api/meals/**   → MEAL-SERVICE (8084)
/api/water/**   → WATER-SERVICE (8085)
/api/users/**   → USER-SERVICE (8082)
/api/auth/**    → AUTH-SERVICE (8081)
```

---

## 🗄️ BASE DE DONNÉES

### PostgreSQL (Auth Service)
- **Base**: `makladb`
- **Port**: 5432
- **User**: `postgres`
- **Password**: `admin`
- **Table**: `users` (id, username, email, password, first_name, last_name, role, enabled, created_at, updated_at)

### H2 (Autres services)
- **Type**: In-memory
- **Console**: `/h2-console`
- **Utilisé par**: Food, Meal, Water, User services

---

## 📦 DÉPENDANCES PRINCIPALES

### Backend (tous les services)
- Spring Boot 3.2.0
- Spring Cloud 2023.0.0
- Java 17+ (testé avec Java 25)
- Maven 3.9.6

### Services spécifiques
- **Eureka Server**: Spring Cloud Netflix Eureka
- **API Gateway**: Spring Cloud Gateway
- **Auth Service**: Spring Security, JWT, PostgreSQL Driver
- **Autres services**: Spring Data JPA, H2 Database

### Frontend
- Angular 18+
- TypeScript 5+
- RxJS 7+
- Node.js 18+
- npm 9+

---

## 🔧 FICHIERS DE CONFIGURATION

### Backend (application.properties)
Chaque service a son `src/main/resources/application.properties` avec :
- `spring.application.name` - Nom du service
- `server.port` - Port d'écoute
- `eureka.client.service-url.defaultZone` - URL Eureka
- Configuration base de données
- Configuration CORS
- Actuator endpoints

### Frontend (environment.ts)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',
  mealServiceUrl: 'http://localhost:8084/api/meals',
  waterServiceUrl: 'http://localhost:8085/api/water',
  // Services directs (pas via Gateway)
};
```

---

## 📜 SCRIPTS POWERSHELL

| Script | Description |
|--------|-------------|
| `START-EVERYTHING.ps1` | Démarre tous les services dans le bon ordre |
| `START-ALL-AUTO.ps1` | Démarrage automatique sans prompts |
| `COMPILE-ALL.ps1` | Compile tous les services Maven |
| `FIX-ALL.ps1` | Corrige les problèmes courants |
| `SETUP-POSTGRESQL.ps1` | Configure PostgreSQL pour auth-service |
| `voir-users.ps1` | Affiche les utilisateurs PostgreSQL |
| `menu.bat` | Menu interactif Windows |

---

## 🌐 INTERFACES WEB

| URL | Description |
|-----|-------------|
| `http://localhost:4200` | Application Angular (Home) |
| `http://localhost:4200/login` | Page de connexion |
| `http://localhost:4200/register` | Page d'inscription |
| `http://localhost:4200/foods` | Gestion aliments |
| `http://localhost:4200/meals` | Gestion repas |
| `http://localhost:4200/water` | Suivi eau |
| `http://localhost:4200/diagnostic` | Diagnostic système |
| `http://localhost:8761` | Eureka Dashboard |
| `voir-users.html` | Interface admin utilisateurs |

---

## 🔄 ORDRE DE DÉMARRAGE

1. **Eureka Server** (8761) - OBLIGATOIRE
2. **Config Server** (8888) - Optionnel
3. **API Gateway** (8080) - OBLIGATOIRE
4. **Auth Service** (8081) - Avec profil `postgres`
5. **User Service** (8082) - Optionnel
6. **Food Service** (8083) - REQUIS
7. **Meal Service** (8084) - REQUIS
8. **Water Service** (8085) - REQUIS
9. **Frontend Angular** (4200)

**Temps d'attente**: 30 secondes après démarrage de tous les services pour l'enregistrement Eureka.

---

## ✅ FONCTIONNALITÉS IMPLÉMENTÉES

### Backend
- ✅ Architecture microservices
- ✅ Service discovery (Eureka)
- ✅ API Gateway avec routage
- ✅ Authentification JWT avec PostgreSQL
- ✅ CRUD aliments (Food Service)
- ✅ CRUD repas (Meal Service)
- ✅ Suivi hydratation (Water Service)
- ✅ CORS configuré
- ✅ Health checks sur tous les services

### Frontend
- ✅ Interface Angular moderne
- ✅ Pages Login/Register
- ✅ Gestion aliments
- ✅ Gestion repas
- ✅ Suivi eau
- ✅ Page diagnostic
- ✅ Design responsive
- ✅ Services directs (pas via Gateway pour dev)

### Base de données
- ✅ PostgreSQL pour Auth Service
- ✅ H2 pour autres services (développement)
- ✅ JPA/Hibernate
- ✅ Migrations automatiques

---

## 📊 STATISTIQUES DU PROJET

- **Services Backend**: 8
- **Services actifs**: 6-8 (selon config)
- **Fichiers source Java**: ~60+
- **Composants Angular**: 7+
- **Services Angular**: 4
- **Scripts PowerShell**: 7
- **Fichiers de documentation**: 12+
- **Total lignes de code**: ~15,000+

---

## 🎉 STATUT ACTUEL

**✅ PROJET 100% FONCTIONNEL**

- Tous les services démarrent correctement
- Gateway route vers tous les services
- Auth Service avec PostgreSQL opérationnel
- Frontend Angular connecté aux services
- Pages Login/Register implémentées
- Interface admin utilisateurs créée
- Documentation complète

---

*Structure mise à jour le 7 Décembre 2025*  
*Projet Makla - Application de suivi nutritionnel*  
*Architecture Microservices Spring Boot + Angular*

