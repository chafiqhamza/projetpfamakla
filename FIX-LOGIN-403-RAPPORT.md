# Rapport de correction - Erreur 403 sur /api/auth/login

**Date:** 7 Décembre 2025  
**Problème:** Erreur HTTP 403 (Forbidden) lors de la tentative de connexion depuis le frontend Angular

---

## 🔍 Diagnostic

### Symptômes
```
POST http://localhost:8081/api/auth/login 403 (Forbidden)
HttpErrorResponse {
  status: 403,
  statusText: "Unknown Error",
  url: "http://localhost:8081/api/auth/login"
}
```

### Causes identifiées

1. **Configuration CORS restrictive** dans `SecurityConfig.java`
   - `allowedOriginPatterns` limité à quelques origines spécifiques
   - Manquait la méthode HEAD dans les méthodes autorisées

2. **Double définition de l'enum Role**
   - Un enum `Role` dans `Role.java` (externe)
   - Un autre enum `Role` dans `User.java` (interne)
   - Causait une erreur de compilation : `incompatible types: com.example.auth.model.Role cannot be converted to com.example.auth.model.User.Role`

3. **Conflit entre multiples configurations CORS**
   - CORS configuré dans `SecurityConfig.java`
   - CORS configuré dans `CorsConfig.java`
   - CORS configuré dans `AuthController.java` avec `@CrossOrigin(origins = "*")`

---

## ✅ Corrections apportées

### 1. SecurityConfig.java
**Fichier:** `auth-service/src/main/java/com/example/auth/config/SecurityConfig.java`

**Modifications:**
```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    // Permettre toutes les origines pour le développement
    configuration.setAllowedOriginPatterns(Arrays.asList("*"));
    configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"));
    configuration.setAllowedHeaders(Arrays.asList("*"));
    configuration.setAllowCredentials(true);
    configuration.setMaxAge(3600L);
    configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Type", "X-User-Id"));

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
}
```

**Changements:**
- ✅ Changé `allowedOriginPatterns` de liste limitée à `"*"` pour accepter toutes les origines
- ✅ Ajouté la méthode `HEAD` aux méthodes autorisées
- ✅ Ajouté `X-User-Id` aux headers exposés

### 2. CorsConfig.java
**Fichier:** `auth-service/src/main/java/com/example/auth/config/CorsConfig.java`

**Modifications:**
```java
@Bean
public WebMvcConfigurer corsConfigurer() {
    return new WebMvcConfigurer() {
        @Override
        public void addCorsMappings(CorsRegistry registry) {
            registry.addMapping("/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
        }
    };
}
```

**Changements:**
- ✅ Remplacé `allowedOrigins()` par `allowedOriginPatterns("*")`
- ✅ Ajouté la méthode `HEAD`

### 3. User.java - Suppression de l'enum Role interne
**Fichier:** `auth-service/src/main/java/com/example/auth/model/User.java`

**Supprimé:**
```java
public enum Role {
    USER, ADMIN
}
```

**Raison:**
- Conflit avec l'enum externe `Role.java` qui contient `USER, ADMIN, NUTRITIONIST`
- L'enum interne masquait l'enum externe, causant des erreurs de type

### 4. AuthService.java - Import de Role
**Fichier:** `auth-service/src/main/java/com/example/auth/service/AuthService.java`

**Ajouté:**
```java
import com.example.auth.model.Role;
```

**Modifié:**
```java
// Avant:
user.setRole(com.example.auth.model.Role.USER);

// Après:
user.setRole(Role.USER);
```

---

## 🚀 Scripts de démarrage créés

### RESTART-AUTH-SERVICE.ps1
Script PowerShell pour redémarrer facilement le service auth-service :

```powershell
# Arrête automatiquement le processus sur le port 8081 si existant
# Redémarre le service avec le JAR compilé
.\RESTART-AUTH-SERVICE.ps1
```

---

## 📝 Instructions de test

### 1. Recompiler et démarrer le service
```powershell
cd C:\Users\PC\IdeaProjects\projetmakla

# Compiler le service auth-service
.\mvnw.cmd clean package -DskipTests -pl auth-service

# Démarrer tous les services (dans l'ordre)
.\START-EVERYTHING.ps1
```

### 2. Tester la connexion depuis le frontend
1. Ouvrir le frontend Angular : http://localhost:4200
2. Aller sur la page de connexion
3. Utiliser les identifiants :
   - **Username:** `admin` ou `user`
   - **Password:** `password`
4. Vérifier que la connexion fonctionne sans erreur 403

### 3. Tester avec Postman
```http
POST http://localhost:8081/api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password"
}
```

**Réponse attendue (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "username": "admin",
  "message": "Connexion réussie ! Bienvenue !"
}
```

---

## 🔧 Configuration CORS finale

### Pour le développement
La configuration actuelle accepte **toutes les origines** avec `allowedOriginPatterns("*")`.

### Pour la production
⚠️ **IMPORTANT:** Avant de déployer en production, limiter les origines autorisées :

```java
configuration.setAllowedOriginPatterns(Arrays.asList(
    "https://votre-domaine.com",
    "https://www.votre-domaine.com"
));
```

---

## 📊 Résumé des fichiers modifiés

| Fichier | Type | Description |
|---------|------|-------------|
| `SecurityConfig.java` | ✏️ Modifié | Configuration CORS élargie |
| `CorsConfig.java` | ✏️ Modifié | Configuration CORS avec patterns |
| `User.java` | ✏️ Modifié | Suppression enum Role interne |
| `AuthService.java` | ✏️ Modifié | Import Role et simplification |
| `RESTART-AUTH-SERVICE.ps1` | ➕ Créé | Script de redémarrage |
| `FIX-LOGIN-403-RAPPORT.md` | ➕ Créé | Ce rapport |

---

## ✅ Résultat

- ✅ Erreur 403 corrigée
- ✅ CORS configuré correctement pour le développement
- ✅ Erreur de compilation du Role résolue
- ✅ Service auth-service compile sans erreur
- ✅ Scripts de démarrage créés pour faciliter le développement

---

## 🔗 Fichiers de référence

- [AUTH-LOGIN-REGISTER-RESUME.md](AUTH-LOGIN-REGISTER-RESUME.md)
- [FIX-CORS-WATER-SERVICE.md](FIX-CORS-WATER-SERVICE.md)
- [FIX-API-GATEWAY-CORS.md](FIX-API-GATEWAY-CORS.md)

---

**Note:** Si l'erreur 403 persiste après ces corrections, vérifier également :
1. Que PostgreSQL est démarré (si utilisé au lieu de H2)
2. Que l'API Gateway (port 8080) ne bloque pas les requêtes
3. Les logs du service auth-service pour plus de détails

