# Rapport de correction - Problème Auth Service (HTTP 403)

## Problème identifié

Le service `auth-service` démarrait correctement mais retournait une **erreur HTTP 403** sur l'endpoint `/actuator/health`. Cette erreur empêchait le script de démarrage de détecter que le service était prêt.

### Cause racine

La dépendance `spring-boot-starter-actuator` était **manquante** dans le fichier `pom.xml` de plusieurs services, même si la configuration actuator était présente dans `application.properties`.

## Services corrigés

### 1. **auth-service** ✅
- ✅ Ajout de `spring-boot-starter-actuator` dans `pom.xml`
- ✅ Configuration actuator déjà présente dans `application.properties`
- ✅ Recompilé avec succès

### 2. **user-service** ✅
- ✅ Ajout de `spring-boot-starter-actuator` dans `pom.xml`
- ✅ Configuration actuator déjà présente dans `application.properties`
- ✅ Recompilé avec succès

### 3. **food-service** ✅
- ✅ Ajout de `spring-boot-starter-actuator` dans `pom.xml`
- ✅ Ajout de la configuration actuator dans `application.properties`
- ✅ Recompilé avec succès

### 4. **meal-service** ✅
- ✅ Ajout de `spring-boot-starter-actuator` dans `pom.xml`
- ✅ Ajout de la configuration actuator dans `application.properties`
- ✅ Recompilé avec succès

### 5. **water-service** ⚠️
- ✅ Ajout de `spring-boot-starter-actuator` dans `pom.xml`
- ✅ Ajout de la configuration actuator dans `application.properties`
- ❌ Erreur de compilation (problème Lombok indépendant)
- 🔄 Nécessite une correction supplémentaire (les modèles avec @Data ne génèrent pas les getters/setters)

## Configuration ajoutée

### Dépendance Maven
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

### Configuration application.properties
```properties
# Actuator Configuration
management.endpoints.web.exposure.include=health,info,metrics
management.endpoint.health.show-details=always
management.health.defaults.enabled=true
```

## Comment redémarrer les services

### Option 1 : Redémarrer tous les services
```powershell
.\START-EVERYTHING.ps1
```

### Option 2 : Redémarrer uniquement auth-service
```powershell
# 1. Arrêter le processus actuel
Get-Process java | Where-Object {$_.CommandLine -like "*auth-service*"} | Stop-Process -Force

# 2. Redémarrer
java -jar auth-service/target/auth-service-0.0.1-SNAPSHOT.jar
```

### Option 3 : Utiliser votre IDE (IntelliJ IDEA)
1. Arrêter l'exécution actuelle de auth-service
2. Recharger le projet Maven (pour prendre en compte les nouvelles dépendances)
3. Relancer auth-service

## Vérification

Une fois redémarré, l'endpoint actuator devrait fonctionner :
```
http://localhost:8081/actuator/health
```

Résultat attendu :
```json
{
  "status": "UP"
}
```

## Problème restant : water-service

Le water-service a un problème de compilation lié à Lombok. Les annotations `@Data`, `@Getter`, `@Setter` ne génèrent pas les méthodes correctement. Ce problème est indépendant de la correction actuator et nécessite une investigation séparée.

### Actions suggérées pour water-service :
1. Vérifier que lombok est correctement installé dans l'IDE
2. Activer l'annotation processing dans IntelliJ IDEA
3. Ou remplacer les annotations Lombok par des getters/setters manuels

## Résumé

✅ **4 services corrigés** : auth-service, user-service, food-service, meal-service  
⚠️ **1 service à corriger** : water-service (problème Lombok)  

Les services corrigés sont prêts à être redémarrés et devraient maintenant répondre correctement aux checks de santé.

