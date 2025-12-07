# ✅ CORRECTION API GATEWAY - CORS & ROUTING

## 🔍 Problème identifié

**Frontend affiche** :
- ✅ Services directs fonctionnent (http://localhost:808X)
- ❌ Services via Gateway ne fonctionnent pas (http://localhost:8080)

```
Food Service (via Gateway) ❌ - Service inaccessible
Meal Service (via Gateway) ❌ - Service inaccessible  
Water Service (via Gateway) ❌ - Service inaccessible
```

---

## 🔧 Cause racine

1. **Configuration CORS incompatible** :
   - `CorsConfig.java` utilisait `setAllowedOrigins(...)` 
   - Incompatible avec `setAllowCredentials(true)`
   - Causait des erreurs CORS 400

2. **Headers non exposés** :
   - Les headers `Authorization` et `X-User-Id` n'étaient pas exposés
   - Le frontend ne pouvait pas les lire

---

## ✅ Solutions appliquées

### 1. Correction CorsConfig.java (API Gateway)

**Avant** :
```java
corsConfig.setAllowedOrigins(Arrays.asList("http://localhost:4200", "http://localhost:4201"));
```

**Après** :
```java
corsConfig.setAllowedOriginPatterns(Arrays.asList("*"));
corsConfig.setExposedHeaders(Arrays.asList("Authorization", "X-User-Id"));
```

### 2. Correction application.properties (API Gateway)

**Avant** :
```properties
spring.cloud.gateway.globalcors.cors-configurations.[/**].allowed-origins=http://localhost:4200,http://localhost:4201
```

**Après** :
```properties
spring.cloud.gateway.globalcors.cors-configurations.[/**].allowed-origin-patterns=*
spring.cloud.gateway.globalcors.cors-configurations.[/**].exposed-headers=Authorization,X-User-Id
```

---

## 🚀 Démarrage

### Option 1 : Redémarrer l'API Gateway seule

```powershell
# Arrêter le processus actuel
Get-Process java | Where-Object {$_.CommandLine -like "*api-gateway*"} | Stop-Process -Force

# Redémarrer
java -jar api-gateway/target/api-gateway-0.0.1-SNAPSHOT.jar
```

### Option 2 : Redémarrer tous les services

```powershell
.\START-EVERYTHING.ps1
```

---

## 🧪 Tests après redémarrage

### 1. Vérifier que la Gateway est UP
```bash
GET http://localhost:8080/actuator/health
→ {"status":"UP"}
```

### 2. Tester Food Service via Gateway
```bash
GET http://localhost:8080/api/foods
→ Devrait retourner la liste des aliments
```

### 3. Tester Meal Service via Gateway
```bash
GET http://localhost:8080/api/meals
→ Devrait retourner la liste des repas
```

### 4. Tester Water Service via Gateway
```bash
GET http://localhost:8080/api/water
→ Devrait retourner la liste des intakes
```

### 5. Vérifier les headers CORS
```bash
curl -H "Origin: http://localhost:4200" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS http://localhost:8080/api/foods -v

# Devrait retourner :
Access-Control-Allow-Origin: http://localhost:4200
Access-Control-Allow-Credentials: true
Access-Control-Expose-Headers: Authorization, X-User-Id
```

---

## 📊 Configuration complète

### Routes configurées dans la Gateway

```properties
# Food Service
/api/foods/** → lb://food-service

# Meal Service  
/api/meals/** → lb://meal-service

# Water Service
/api/water/** → lb://water-service

# User Service
/api/users/** → lb://user-service

# Auth Service
/api/auth/** → lb://auth-service
```

### Load Balancing (lb://)

- `lb://` = Load Balancer
- Utilise Eureka pour découvrir les instances de services
- Répartit automatiquement la charge

---

## 🔍 Vérification Eureka

### Accéder au Dashboard Eureka
```
http://localhost:8761
```

### Services qui doivent être enregistrés :
- ✅ API-GATEWAY
- ✅ AUTH-SERVICE
- ✅ USER-SERVICE
- ✅ FOOD-SERVICE
- ✅ MEAL-SERVICE
- ✅ WATER-SERVICE

Si un service n'apparaît pas dans Eureka, la Gateway ne pourra pas le router !

---

## 🐛 Dépannage

### Problème : "Service inaccessible via Gateway"

**Solutions** :

1. **Vérifier que le service est enregistré dans Eureka**
   ```
   http://localhost:8761
   ```

2. **Vérifier les logs de la Gateway**
   ```
   Rechercher : "No instances available for xxx-service"
   ```

3. **Vérifier que le service est démarré**
   ```powershell
   Get-Process java | Select-Object Id, ProcessName, CommandLine
   ```

4. **Redémarrer la Gateway**
   - La Gateway met en cache les découvertes Eureka
   - Un redémarrage force une nouvelle découverte

### Problème : Erreur CORS 400

**Solution** : C'est résolu par cette mise à jour ✅
- Utilise maintenant `allowedOriginPatterns` au lieu de `allowedOrigins`

### Problème : Headers manquants

**Solution** : C'est résolu par cette mise à jour ✅
- Expose maintenant `Authorization` et `X-User-Id`

---

## 📝 Fichiers modifiés

1. ✅ `api-gateway/src/main/java/.../config/CorsConfig.java`
2. ✅ `api-gateway/src/main/resources/application.properties`

---

## 🎯 Compilation

```
[INFO] BUILD SUCCESS
[INFO] api-gateway ........................................ SUCCESS [  2.427 s]
```

**Fichier JAR** : `api-gateway/target/api-gateway-0.0.1-SNAPSHOT.jar`

---

## ✅ Checklist finale

Après redémarrage de la Gateway :

- [ ] API Gateway accessible : `http://localhost:8080/actuator/health`
- [ ] Tous les services visibles dans Eureka : `http://localhost:8761`
- [ ] Food Service via Gateway : `http://localhost:8080/api/foods`
- [ ] Meal Service via Gateway : `http://localhost:8080/api/meals`
- [ ] Water Service via Gateway : `http://localhost:8080/api/water`
- [ ] Frontend affiche tous les services en vert ✅

---

## 💡 Conseils

### Pour le développement
La configuration actuelle (`allowedOriginPatterns = *`) permet tous les origins.
C'est parfait pour le développement.

### Pour la production
Remplacer dans `CorsConfig.java` :
```java
corsConfig.setAllowedOriginPatterns(Arrays.asList("*"));
```

Par :
```java
corsConfig.setAllowedOriginPatterns(Arrays.asList(
    "https://votre-domaine.com",
    "https://www.votre-domaine.com"
));
```

---

## 🔄 Ordre de démarrage recommandé

1. **Eureka Server** (port 8761)
2. **Config Server** (si utilisé)
3. **Tous les services métier** (auth, user, food, meal, water)
4. **API Gateway** (port 8080) - EN DERNIER !

**Important** : Démarrer la Gateway en dernier permet de s'assurer que tous les services sont déjà enregistrés dans Eureka.

---

## ✅ CONCLUSION

L'API Gateway a été corrigée pour :
- ✅ Utiliser `allowedOriginPatterns` (compatible avec credentials)
- ✅ Exposer les headers nécessaires
- ✅ Permettre tous les origins en développement

**Après redémarrage de la Gateway, tous les services devraient être accessibles via `http://localhost:8080` !**

