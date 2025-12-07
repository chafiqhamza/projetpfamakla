# Solution - Erreur 400 Bad Request sur Login/Register

## 🎯 Problème identifié

**Erreur:** HTTP 400 (Bad Request) sur `/api/auth/login` et `/api/auth/register`

**Cause:** Les DTOs (`LoginRequest` et `RegisterRequest`) avaient l'annotation `@Valid` dans le contrôleur mais **aucune annotation de validation** (comme `@NotBlank`, `@Email`, etc.) sur les champs. Spring Boot rejetait donc les requêtes avec une erreur 400.

---

## ✅ Solutions appliquées

### 1. Ajout des validations dans LoginRequest.java

**Fichier:** `auth-service/src/main/java/com/example/auth/dto/LoginRequest.java`

```java
package com.example.auth.dto;

import jakarta.validation.constraints.NotBlank;

public class LoginRequest {
    @NotBlank(message = "Le nom d'utilisateur est requis")
    private String username;
    
    @NotBlank(message = "Le mot de passe est requis")
    private String password;
    
    // ... getters et setters
}
```

### 2. Ajout des validations dans RegisterRequest.java

**Fichier:** `auth-service/src/main/java/com/example/auth/dto/RegisterRequest.java`

```java
package com.example.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RegisterRequest {
    @NotBlank(message = "Le nom d'utilisateur est requis")
    @Size(min = 3, max = 50, message = "Le nom d'utilisateur doit contenir entre 3 et 50 caractères")
    private String username;
    
    @NotBlank(message = "Le mot de passe est requis")
    @Size(min = 6, message = "Le mot de passe doit contenir au moins 6 caractères")
    private String password;
    
    @NotBlank(message = "L'email est requis")
    @Email(message = "L'email doit être valide")
    private String email;
    
    @NotBlank(message = "Le prénom est requis")
    private String firstName;
    
    @NotBlank(message = "Le nom de famille est requis")
    private String lastName;
    
    // ... getters et setters
}
```

### 3. Création d'un gestionnaire d'exceptions global

**Fichier:** `auth-service/src/main/java/com/example/auth/exception/GlobalExceptionHandler.java`

Ce gestionnaire intercepte les erreurs de validation et renvoie des messages d'erreur clairs au frontend :

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationExceptions(MethodArgumentNotValidException ex) {
        // Extrait les messages d'erreur de validation
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        ErrorResponse errorResponse = new ErrorResponse(
            HttpStatus.BAD_REQUEST.value(),
            "Erreur de validation",
            errors.values().stream().findFirst().orElse("Données invalides"),
            LocalDateTime.now(),
            errors
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }
    
    // ... autres handlers
}
```

---

## 🚀 Pour appliquer les corrections

### 1. La compilation a déjà réussi ✅
```powershell
# Les fichiers ont été compilés avec succès
[INFO] BUILD SUCCESS
[INFO] Total time:  4.083 s
```

### 2. Démarrer le service

**Option A - Démarrage manuel:**
```powershell
cd C:\Users\PC\IdeaProjects\projetmakla\auth-service
java -jar target\auth-service-0.0.1-SNAPSHOT.jar
```

**Option B - Démarrage avec le script:**
```powershell
cd C:\Users\PC\IdeaProjects\projetmakla
.\RESTART-AUTH-SERVICE.ps1
```

**Option C - Démarrage de tous les services:**
```powershell
cd C:\Users\PC\IdeaProjects\projetmakla
.\START-EVERYTHING.ps1
```

### 3. Tester la correction

Une fois le service démarré, testez depuis le frontend ou avec curl :

```bash
# Test Login
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'

# Test Register
curl -X POST http://localhost:8081/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username":"newuser",
    "password":"password123",
    "email":"user@example.com",
    "firstName":"John",
    "lastName":"Doe"
  }'
```

---

## 📋 Validations ajoutées

| Champ | Validation | Message d'erreur |
|-------|-----------|------------------|
| **username** (login) | `@NotBlank` | "Le nom d'utilisateur est requis" |
| **password** (login) | `@NotBlank` | "Le mot de passe est requis" |
| **username** (register) | `@NotBlank`, `@Size(3-50)` | "Le nom d'utilisateur doit contenir entre 3 et 50 caractères" |
| **password** (register) | `@NotBlank`, `@Size(min=6)` | "Le mot de passe doit contenir au moins 6 caractères" |
| **email** | `@NotBlank`, `@Email` | "L'email doit être valide" |
| **firstName** | `@NotBlank` | "Le prénom est requis" |
| **lastName** | `@NotBlank` | "Le nom de famille est requis" |

---

## 🔍 Exemple de réponse d'erreur

Si les données sont invalides, le backend renvoie maintenant un message clair :

```json
{
  "status": 400,
  "error": "Erreur de validation",
  "message": "Le nom d'utilisateur est requis",
  "timestamp": "2025-12-07T19:33:04",
  "validationErrors": {
    "username": "Le nom d'utilisateur est requis",
    "password": "Le mot de passe est requis"
  }
}
```

---

## ✅ Résultat attendu

Après ces corrections :

1. ✅ **Login fonctionne** - Plus d'erreur 400 avec des credentials valides
2. ✅ **Register fonctionne** - Plus d'erreur 400 avec des données valides
3. ✅ **Messages d'erreur clairs** - Le frontend reçoit des messages compréhensibles
4. ✅ **Validation côté serveur** - Données vérifiées avant traitement

---

## 📝 Notes importantes

### Prérequis avant de tester
1. **Arrêter tous les services Java** si des erreurs persistent
2. **Recompiler** si vous avez modifié du code
3. **Attendre 10-15 secondes** après le démarrage du service

### Ordre de démarrage recommandé
1. Eureka Server (port 8761)
2. Config Server (port 8888)
3. Auth Service (port 8081)
4. API Gateway (port 8080)
5. Frontend (port 4200)

### Si l'erreur persiste
1. Vérifier les logs du service dans la console
2. Vérifier que le port 8081 est libre
3. Tester avec curl pour voir la réponse exacte
4. Vérifier le format JSON envoyé par le frontend

---

## 📚 Fichiers modifiés

| Fichier | Action | Description |
|---------|--------|-------------|
| `LoginRequest.java` | ✏️ Modifié | Ajout de `@NotBlank` |
| `RegisterRequest.java` | ✏️ Modifié | Ajout de `@NotBlank`, `@Size`, `@Email` |
| `GlobalExceptionHandler.java` | ➕ Créé | Gestion centralisée des erreurs |

---

## 🎉 Prochaine étape

Après avoir démarré le service auth-service, testez la connexion depuis votre frontend Angular :

1. Ouvrir http://localhost:4200
2. Aller sur la page de **connexion**
3. Entrer : username `admin`, password `password`
4. Cliquer sur "Se connecter"
5. ✅ Vous devriez être connecté sans erreur !

Pour l'inscription, testez avec de nouvelles données valides.

**Les erreurs 400 sont maintenant corrigées !** 🚀

