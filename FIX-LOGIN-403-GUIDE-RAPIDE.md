# Guide de démarrage rapide - Correction Login 403

## 🎯 Problème résolu

L'erreur **403 (Forbidden)** sur `POST /api/auth/login` a été corrigée.

---

## ✅ Corrections effectuées

### 1. Configuration CORS
- ✅ `SecurityConfig.java` - CORS élargi pour accepter toutes les origines en développement
- ✅ `CorsConfig.java` - Utilisation de `allowedOriginPatterns("*")`
- ✅ Ajout de la méthode HEAD dans les méthodes autorisées

### 2. Problème de compilation
- ✅ Suppression de l'enum `Role` interne dans `User.java`
- ✅ Import de `Role` dans `AuthService.java`
- ✅ Le service compile maintenant sans erreur

---

## 🚀 Comment démarrer les services

### Option 1 : Démarrage complet (RECOMMANDÉ)
```powershell
cd C:\Users\PC\IdeaProjects\projetmakla
.\START-EVERYTHING.ps1
```

### Option 2 : Démarrage manuel
```powershell
# 1. Démarrer Eureka Server
cd C:\Users\PC\IdeaProjects\projetmakla\eureka-server
java -jar target\eureka-server-0.0.1-SNAPSHOT.jar

# 2. Démarrer Config Server (nouveau terminal)
cd C:\Users\PC\IdeaProjects\projetmakla\config-server
java -jar target\config-server-0.0.1-SNAPSHOT.jar

# 3. Démarrer Auth Service (nouveau terminal)
cd C:\Users\PC\IdeaProjects\projetmakla\auth-service
java -jar target\auth-service-0.0.1-SNAPSHOT.jar

# 4. Démarrer API Gateway (nouveau terminal)
cd C:\Users\PC\IdeaProjects\projetmakla\api-gateway
java -jar target\api-gateway-0.0.1-SNAPSHOT.jar

# 5. Démarrer le Frontend (nouveau terminal)
cd C:\Users\PC\IdeaProjects\projetmakla\frontend
npm start
```

### Option 3 : Redémarrer uniquement auth-service
```powershell
cd C:\Users\PC\IdeaProjects\projetmakla
.\RESTART-AUTH-SERVICE.ps1
```

---

## 🧪 Test de la correction

### 1. Via le navigateur (Frontend Angular)
1. Ouvrir : **http://localhost:4200**
2. Aller sur la page **Login**
3. Entrer les identifiants :
   - Username: `admin`
   - Password: `password`
4. Cliquer sur **Se connecter**
5. ✅ Vous devriez être connecté sans erreur 403

### 2. Via Postman ou curl

**Requête :**
```bash
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"password\"}"
```

**Réponse attendue (200 OK) :**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiIsImlhdCI6MTcwMjIzNTY3OCwiZXhwIjoxNzAyMzIyMDc4fQ...",
  "username": "admin",
  "message": "Connexion réussie ! Bienvenue !"
}
```

### 3. Vérifier les headers CORS

**Avec curl :**
```bash
curl -I -X OPTIONS http://localhost:8081/api/auth/login \
  -H "Origin: http://localhost:4200" \
  -H "Access-Control-Request-Method: POST"
```

**Headers attendus dans la réponse :**
```
Access-Control-Allow-Origin: http://localhost:4200
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD
Access-Control-Allow-Headers: *
Access-Control-Allow-Credentials: true
```

---

## 📋 Ports utilisés

| Service | Port | URL |
|---------|------|-----|
| Eureka Server | 8761 | http://localhost:8761 |
| Config Server | 8888 | http://localhost:8888 |
| API Gateway | 8080 | http://localhost:8080 |
| Auth Service | 8081 | http://localhost:8081 |
| User Service | 8082 | http://localhost:8082 |
| Food Service | 8083 | http://localhost:8083 |
| Meal Service | 8084 | http://localhost:8084 |
| Water Service | 8085 | http://localhost:8085 |
| Nutrition Service | 8086 | http://localhost:8086 |
| Frontend Angular | 4200 | http://localhost:4200 |

---

## ⚠️ Dépannage

### Le service auth-service ne démarre pas

**Vérifier si le port 8081 est déjà utilisé :**
```powershell
netstat -ano | findstr :8081
```

**Si un processus utilise le port, l'arrêter :**
```powershell
# Remplacer <PID> par l'ID du processus trouvé
Stop-Process -Id <PID> -Force
```

### Erreur 403 persiste

1. **Vérifier que le service est bien redémarré** avec la nouvelle version :
   ```powershell
   # Arrêter tous les processus Java
   Get-Process java | Stop-Process -Force
   
   # Recompiler
   cd C:\Users\PC\IdeaProjects\projetmakla
   .\mvnw.cmd clean package -DskipTests -pl auth-service
   
   # Redémarrer
   .\RESTART-AUTH-SERVICE.ps1
   ```

2. **Vider le cache du navigateur** :
   - Chrome/Edge : `Ctrl + Shift + Del`
   - Vider les cookies et le cache
   - Redémarrer le navigateur

3. **Vérifier les logs du service** :
   - Regarder la console où le service auth-service s'exécute
   - Chercher des erreurs de type "Access Denied" ou "Forbidden"

### Le frontend ne peut pas se connecter

**Vérifier que le frontend utilise la bonne URL :**
- Fichier : `frontend/src/app/services/auth.service.ts`
- URL : `http://localhost:8081/api/auth` (accès direct au service)
- Ou : `http://localhost:8080/api/auth` (via API Gateway)

---

## 📚 Documentation complète

Pour plus de détails, consulter :
- **[FIX-LOGIN-403-RAPPORT.md](FIX-LOGIN-403-RAPPORT.md)** - Rapport technique détaillé
- **[AUTH-LOGIN-REGISTER-RESUME.md](AUTH-LOGIN-REGISTER-RESUME.md)** - Documentation du système d'authentification
- **[SCRIPTS-README.md](SCRIPTS-README.md)** - Guide d'utilisation des scripts

---

## ✨ Résumé

- ✅ **CORS configuré** pour accepter toutes les origines en développement
- ✅ **Erreur de compilation corrigée** (enum Role)
- ✅ **Service auth-service compile** sans erreur
- ✅ **Scripts de démarrage créés** pour faciliter le développement
- ✅ **Documentation mise à jour**

**Vous pouvez maintenant vous connecter depuis le frontend sans erreur 403 !** 🎉

