# 🚀 GUIDE DEMARRAGE RAPIDE - IntelliJ IDEA

## ⚠️ PROBLEME: Java 25 + Maven = Incompatible

Votre système a Java 25, mais Maven ne compile pas avec cette version.

## ✅ SOLUTION: Utiliser IntelliJ IDEA

IntelliJ IDEA peut télécharger et utiliser Java 17 automatiquement !

---

## 📋 METHODE 1: Script Guidé (RECOMMANDÉ)

```powershell
.\START-WITH-INTELLIJ.ps1
```

Ce script vous guide étape par étape pour démarrer tous les services.

---

## 📋 METHODE 2: Manuel (5 minutes)

### Étape 1: Configurer le JDK (Une seule fois)

1. **Ouvrir IntelliJ IDEA**
2. **File → Open** → Sélectionner `C:\Users\PC\IdeaProjects\projetmakla`
3. **File → Project Structure** (Ctrl+Alt+Shift+S)
4. **Project Settings → Project**
5. **SDK:** Cliquer sur **Add SDK → Download JDK...**
6. **Sélectionner:**
   - Version: **17**
   - Vendor: **Eclipse Temurin (AdoptOpenJDK HotSpot)**
7. **Cliquer:** Download
8. **Appliquer** et **OK**

### Étape 2: Build le Projet

1. **Build → Build Project** (Ctrl+F9)
2. **Attendre** que la compilation se termine (voir barre en bas)
3. ✅ Si succès: "Build completed successfully"

### Étape 3: Démarrer les Services (Dans cet ordre)

#### 🟢 Service 1: Eureka Server (OBLIGATOIRE)
1. Ouvrir: `eureka-server/src/main/java/com/example/eureka/EurekaServerApplication.java`
2. Clic droit sur le fichier → **Run 'EurekaServerApplication'**
3. ⏱️ **Attendre 30 secondes**
4. ✅ Vérifier: http://localhost:8761

#### 🟢 Service 2: API Gateway (OBLIGATOIRE)
1. Ouvrir: `api-gateway/src/main/java/com/example/gateway/ApiGatewayApplication.java`
2. Clic droit → **Run 'ApiGatewayApplication'**
3. ⏱️ **Attendre 15 secondes**
4. ✅ Vérifier: http://localhost:8080/actuator/health

#### 🟢 Service 3: Food Service (REQUIS)
1. Ouvrir: `food-service/src/main/java/com/example/food/FoodServiceApplication.java`
2. Clic droit → **Run 'FoodServiceApplication'**
3. ⏱️ **Attendre 15 secondes**
4. ✅ Vérifier: http://localhost:8083/api/foods/health

#### 🟢 Service 4: Meal Service (REQUIS)
1. Ouvrir: `meal-service/src/main/java/com/example/meal/MealServiceApplication.java`
2. Clic droit → **Run 'MealServiceApplication'**
3. ⏱️ **Attendre 15 secondes**
4. ✅ Vérifier: http://localhost:8084/api/meals/health

#### 🟢 Service 5: Water Service (REQUIS)
1. Ouvrir: `water-service/src/main/java/com/example/water/WaterServiceApplication.java`
2. Clic droit → **Run 'WaterServiceApplication'**
3. ⏱️ **Attendre 15 secondes**
4. ✅ Vérifier: http://localhost:8085/api/water/health

### Étape 4: Démarrer le Frontend

```powershell
cd frontend
npm install  # Si première fois
npm start
```

Ouvrir: http://localhost:4200

---

## 🎯 VERIFICATION RAPIDE

### Tous les services dans IntelliJ

**View → Tool Windows → Services** (Alt+8)

Vous devriez voir 5 services en cours d'exécution avec des icônes vertes.

### Eureka Dashboard

Ouvrir: http://localhost:8761

Vous devriez voir 5 applications enregistrées:
- API-GATEWAY
- FOOD-SERVICE
- MEAL-SERVICE
- WATER-SERVICE

### Page Diagnostic Frontend

Ouvrir: http://localhost:4200/diagnostic

Tous les services devraient être ✅ verts.

---

## ⚡ RACCOURCIS INTELLIJ UTILES

| Action | Raccourci |
|--------|-----------|
| Build Project | **Ctrl+F9** |
| Run | **Shift+F10** |
| Stop | **Ctrl+F2** |
| Services Window | **Alt+8** |
| Find File | **Ctrl+Shift+N** |

---

## 🔄 GESTION DES SERVICES

### Voir tous les services en cours
1. **View → Tool Windows → Services** (Alt+8)
2. Développer **Spring Boot**
3. Vous voyez tous les services actifs

### Arrêter un service
1. Dans Services, cliquer sur le service
2. Cliquer sur le bouton **Stop** (carré rouge)

### Redémarrer un service
1. Dans Services, cliquer sur le service
2. Cliquer sur le bouton **Restart** (flèche circulaire)

### Voir les logs d'un service
1. Dans Services, cliquer sur le service
2. Les logs s'affichent en bas

---

## 🐛 DEPANNAGE

### "Cannot resolve symbol"
**Solution:**
1. File → Invalidate Caches...
2. Sélectionner: Invalidate and Restart
3. Attendre que Maven réimporte tout

### Service ne démarre pas
**Vérifier:**
1. Le port n'est pas déjà utilisé
2. Eureka est bien démarré AVANT les autres services
3. Les logs dans IntelliJ pour voir l'erreur exacte

### Water Service - Erreurs Lombok
**Solution:** Déjà corrigé dans le code !
Le pom.xml du water-service a été mis à jour avec la configuration Lombok.

### Services 503 via Gateway
**Solution:** Déjà corrigé !
Les noms de services dans le Gateway ont été changés en minuscules.

---

## 💡 ASTUCES

### Démarrage Rapide (Après la première fois)

1. **Ouvrir IntelliJ IDEA**
2. Le projet se charge automatiquement
3. **Dans Services (Alt+8):**
   - Sélectionner tous les services (Ctrl+A)
   - Clic droit → **Run**
4. ✅ Tous démarrent en parallèle !

### Configuration Run/Debug

Vous pouvez créer une configuration pour démarrer tout en 1 clic:

1. **Run → Edit Configurations...**
2. **+ → Compound**
3. Nom: "Start All Services"
4. Ajouter tous les services Spring Boot
5. **Apply**

Maintenant: **Run → Start All Services** démarre tout !

---

## 📊 ORDRE DE DEMARRAGE (Important!)

```
1. Eureka Server (Port 8761)   → Attend 30s
   ↓
2. API Gateway (Port 8080)      → Attend 15s
   ↓
3. Food Service (Port 8083)     → Attend 10s
   ↓
4. Meal Service (Port 8084)     → Attend 10s
   ↓
5. Water Service (Port 8085)    → Attend 10s
   ↓
6. Frontend Angular (Port 4200)
```

**Total: ~90 secondes**

---

## ✅ CHECKLIST DE DEMARRAGE

- [ ] IntelliJ IDEA ouvert avec le projet
- [ ] JDK 17 configuré
- [ ] Projet compilé (Build → Build Project)
- [ ] Eureka Server démarré et prêt (30s)
- [ ] API Gateway démarré et prêt (15s)
- [ ] Food Service démarré et prêt (10s)
- [ ] Meal Service démarré et prêt (10s)
- [ ] Water Service démarré et prêt (10s)
- [ ] Eureka Dashboard montre 5 services
- [ ] Frontend démarré (npm start)
- [ ] Page Diagnostic tout vert

---

## 🎉 SUCCES!

Si tous les services sont verts dans la page Diagnostic, vous pouvez:

1. **Créer des aliments** (Foods)
2. **Créer des repas** (Meals)
3. **Suivre votre hydratation** (Water)

---

## 📞 SUPPORT

Si problème:
1. Vérifier les logs dans IntelliJ (onglet Run de chaque service)
2. Vérifier Eureka: http://localhost:8761
3. Exécuter: `.\TEST-SERVICES.ps1`
4. Page Diagnostic: http://localhost:4200/diagnostic

---

**Avec IntelliJ IDEA, le problème Java 25 est contourné et tout fonctionne parfaitement !** ✨

**Date:** 2025-12-07

