# 🍎 Makla - Nutrition Tracking Application

Application complète de suivi nutritionnel développée avec Spring Boot (microservices) et Angular.

## 📋 Description

Makla est une application de gestion de nutrition permettant aux utilisateurs de :
- Suivre leur consommation alimentaire quotidienne
- Enregistrer leurs repas et aliments
- Monitorer leur consommation d'eau
- Obtenir des analyses nutritionnelles
- Gérer leur profil et leurs objectifs

## 🏗️ Architecture

### Backend - Microservices Spring Boot

- **Eureka Server** (8761) - Service Registry
- **Config Server** (8888) - Configuration centralisée
- **API Gateway** (8080) - Point d'entrée unique
- **Auth Service** (8081) - Authentification JWT
- **User Service** (8082) - Gestion des utilisateurs
- **Food Service** (8083) - Gestion des aliments
- **Meal Service** (8084) - Gestion des repas
- **Water Service** (8085) - Suivi de l'hydratation
- **Nutrition Service** (8086) - Analyses nutritionnelles

### Frontend - Angular 18

- Interface utilisateur moderne et responsive
- Composants standalone
- Communication avec le backend via HTTP

## 🚀 Démarrage rapide

### Prérequis

- **Java 17** ou supérieur
- **Node.js 18** ou supérieur
- **Maven 3.8+**
- **Git**

### Installation

1. **Cloner le repository**
```bash
git clone https://github.com/chafiqhamza/projetpfamakla.git
cd projetpfamakla
```

2. **Démarrer tous les services**
```powershell
# Windows
.\START-EVERYTHING.ps1

# Linux/Mac
./start-everything.sh
```

3. **Accéder à l'application**
- Frontend: http://localhost:4200
- Eureka Dashboard: http://localhost:8761
- API Gateway: http://localhost:8080

## 👤 Utilisateurs par défaut

| Username | Password | Rôle |
|----------|----------|------|
| admin | password | ADMIN |
| user | password | USER |
| nutritionist | password | NUTRITIONIST |

## 🛠️ Technologies utilisées

### Backend
- Spring Boot 3.2.0
- Spring Cloud (Eureka, Gateway, Config)
- Spring Security + JWT
- Spring Data JPA
- H2 Database (dev) / PostgreSQL (prod)
- Maven

### Frontend
- Angular 18
- TypeScript
- RxJS
- Standalone Components

## 📁 Structure du projet

```
projetmakla/
├── eureka-server/          # Service Registry
├── config-server/          # Configuration Service
├── api-gateway/            # API Gateway
├── auth-service/           # Authentication Service
├── user-service/           # User Management
├── food-service/           # Food Management
├── meal-service/           # Meal Management
├── water-service/          # Water Tracking
├── nutrition-service/      # Nutrition Analysis
└── frontend/               # Angular Application
```

## 🔧 Configuration

### Base de données

Par défaut, l'application utilise H2 (en mémoire). Pour PostgreSQL :

1. Installer PostgreSQL
2. Créer la base de données : `makla_db`
3. Configurer les credentials dans `application-postgres.properties`
4. Lancer avec le profil : `spring.profiles.active=postgres`

### Variables d'environnement

```properties
# JWT
jwt.secret=mySecretKey
jwt.expiration=86400000

# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/makla_db
spring.datasource.username=makla_user
spring.datasource.password=makla_password
```

## 📚 Documentation

- [Guide complet d'installation](SOLUTION-FINALE-COMPLETE-V2.md)
- [Configuration PostgreSQL](AUTH-POSTGRESQL-GUIDE-COMPLET.md)
- [Structure du projet](STRUCTURE-PROJET-MAKLA.md)
- [Scripts disponibles](SCRIPTS-README.md)
- [Collection Postman](Makla-API.postman_collection.json)

## 🧪 Tests

### Tester l'API
```bash
# Test de santé
curl http://localhost:8081/actuator/health

# Test login
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

### Script de test automatique
```powershell
.\TEST-LOGIN-FIX.ps1
```

## 🐳 Docker

```bash
# Construire les images
docker-compose build

# Démarrer les services
docker-compose up -d

# Arrêter les services
docker-compose down
```

## 📝 Scripts disponibles

| Script | Description |
|--------|-------------|
| `START-EVERYTHING.ps1` | Démarre tous les services |
| `COMPILE-ALL.ps1` | Compile tous les services |
| `RESTART-AUTH-SERVICE.ps1` | Redémarre le service auth |
| `TEST-LOGIN-FIX.ps1` | Teste l'authentification |
| `SETUP-POSTGRESQL.ps1` | Configure PostgreSQL |

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT.

## 👨‍💻 Auteurs

- **Hamza Chafiq** - [GitHub](https://github.com/chafiqhamza)

## 🙏 Remerciements

- Spring Boot Team
- Angular Team
- Tous les contributeurs

## 📞 Support

Pour toute question ou problème :
- Créer une [Issue](https://github.com/chafiqhamza/projetpfamakla/issues)
- Consulter la [Documentation](SOLUTION-FINALE-COMPLETE-V2.md)

## 🎯 Roadmap

- [ ] Notifications en temps réel
- [ ] Application mobile
- [ ] Intégration avec des API nutritionnelles externes
- [ ] Système de recommandations personnalisées
- [ ] Export PDF des rapports nutritionnels

---

**Développé avec ❤️ pour une meilleure nutrition**

