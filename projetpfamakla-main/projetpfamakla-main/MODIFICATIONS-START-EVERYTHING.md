# ✅ MODIFICATIONS APPLIQUÉES - START-EVERYTHING.ps1

## 📋 Résumé des changements

Le script **START-EVERYTHING.ps1** a été mis à jour pour inclure le **AI Service (RAG + Agent IA)** avec toutes les fonctionnalités suivantes :

---

## 🎯 Nouvelles Fonctionnalités Ajoutées

### 1. Démarrage du AI Service (Port 8087)
- ✅ Vérification automatique d'Ollama
- ✅ Téléchargement automatique de Phi3 si nécessaire
- ✅ Démarrage d'Ollama si non actif
- ✅ Démarrage du AI Service avec RAG + Agent

### 2. Vérifications Intelligentes

#### Avant de démarrer :
```
Verification d'Ollama...
  ✅ Ollama + Phi3: OK
```

#### Si Ollama n'est pas actif :
```
  ❌ Ollama non actif!
  
  Voulez-vous demarrer Ollama maintenant? (O/N)
```

#### Si Phi3 n'est pas installé :
```
  ⚠️  Phi3 non trouve. Telechargement automatique...
  (Cela peut prendre quelques minutes - 1.6 GB)
  ✅ Phi3 telecharge!
```

### 3. Affichage Amélioré

Quand le AI Service démarre avec succès :
```
========================================
AI SERVICE PRET!
========================================
Endpoints disponibles:
  - Chat RAG:     POST http://localhost:8087/api/rag/chat
  - Agent Goals:  POST http://localhost:8087/api/agent/calculate-goals
  - Health:       GET  http://localhost:8087/actuator/health
```

### 4. Vérification dans le Health Check

Le AI Service est maintenant inclus dans les vérifications finales :
```
Test: AI Service (RAG + Agent)... OK
```

### 5. Instructions Utilisateur

À la fin du script, les instructions incluent maintenant :
```
💬 Tester le Chatbot RAG + Agent:
  1. Ouvrir http://localhost:4200
  2. Cliquer sur le bouton 🤖 en bas a droite
  3. Mode Agent: cliquer sur 'Basic' pour activer
  4. Tester: 'Qu'est-ce que le diabete?' ou cliquer '🎯 Objectifs'
```

---

## 🚀 Comment utiliser le script mis à jour

### Méthode Simple (Recommandée)

**Double-cliquer sur :**
```
START-EVERYTHING.ps1
```

Le script va :
1. Vérifier Java, JAVA_HOME
2. Démarrer Eureka Server
3. Démarrer API Gateway
4. Proposer de démarrer chaque service (Auth, User, Food, Meal, Water)
5. **Proposer de démarrer AI Service avec RAG + Agent**
   - Vérifier Ollama
   - Installer Phi3 si nécessaire
   - Démarrer le service sur le port 8087
6. Vérifier tous les services
7. Proposer de démarrer le Frontend

---

## 📊 Ordre de Démarrage

```
1. ✅ Eureka Server (8761)
   ↓
2. ✅ Config Server (8888) [optionnel]
   ↓
3. ✅ API Gateway (8080)
   ↓
4. ✅ Auth Service (8081) [optionnel]
   ↓
5. ✅ User Service (8082) [optionnel]
   ↓
6. ✅ Food Service (8083)
   ↓
7. ✅ Meal Service (8084)
   ↓
8. ✅ Water Service (8085)
   ↓
9. 🆕 AI Service (8087) - RAG + Agent IA
   • Vérification Ollama
   • Démarrage automatique si nécessaire
   • Installation Phi3 si nécessaire
   ↓
10. ⏳ Attente 30 secondes (enregistrement Eureka)
    ↓
11. ✅ Vérification santé de tous les services
    ↓
12. ✅ Frontend Angular (4200)
```

---

## 🔍 Scénarios d'Utilisation

### Scénario 1 : Démarrage Complet (Tous les services)

**Réponses aux questions :**
- Config Server ? **N** (optionnel)
- Auth Service ? **N** (optionnel pour les tests)
- User Service ? **N** (optionnel pour les tests)
- AI Service (RAG + Agent) ? **O** ← **IMPORTANT !**
- Frontend Angular ? **O**

**Résultat :**
- ✅ Eureka (8761)
- ✅ Gateway (8080)
- ✅ Food (8083)
- ✅ Meal (8084)
- ✅ Water (8085)
- ✅ **AI Service (8087)** ← Chatbot RAG + Agent
- ✅ Frontend (4200)

---

### Scénario 2 : Démarrage Minimal (Services essentiels uniquement)

**Réponses :**
- Config Server ? **N**
- Auth Service ? **N**
- User Service ? **N**
- AI Service ? **O** ← Pour le chatbot
- Frontend ? **O**

**Services actifs :**
- Eureka, Gateway, Food, Meal, Water, **AI Service**, Frontend

---

### Scénario 3 : Tester uniquement le Chatbot

**Réponses :**
- Tous les services optionnels : **N**
- **AI Service ? O** ← Essentiel
- Frontend ? **O**

Le chatbot fonctionnera même sans les autres services !

---

## 🧪 Tests du AI Service

### Test 1 : Vérifier que le service est actif

**PowerShell :**
```powershell
curl http://localhost:8087/actuator/health
```

**Attendu :**
```json
{"status":"UP"}
```

### Test 2 : Tester le RAG (Chat)

**PowerShell :**
```powershell
$body = @{
    message = "Qu'est-ce que le diabète?"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8087/api/rag/chat" -Method POST -Body $body -ContentType "application/json"
```

### Test 3 : Tester l'Agent (Calcul Objectifs)

**PowerShell :**
```powershell
$profile = @{
    userId = "test-user"
    age = 30
    weight = 70
    height = 170
    gender = "MALE"
    activityLevel = "MODERATE"
    healthConditions = @("DIABETIC")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8087/api/agent/calculate-goals" -Method POST -Body $profile -ContentType "application/json"
```

**Attendu :**
```json
{
  "calories": 2301,
  "carbs": 130,
  "protein": 115,
  "fat": 77,
  "water": 2500
}
```

### Test 4 : Tester dans le Frontend

1. Ouvrir **http://localhost:4200**
2. Cliquer sur **🤖** (bouton chat en bas à droite)
3. Poser : "Qu'est-ce que le diabète ?"
4. Vérifier la réponse (doit utiliser la base de connaissances)
5. Cliquer sur "Basic" pour passer en mode "Agent"
6. Cliquer sur **"🎯 Objectifs"**
7. Vérifier les suggestions personnalisées
8. Cliquer **"Accept"**
9. Vérifier que le Dashboard est mis à jour

---

## ⚙️ Configuration du AI Service

### Fichiers Importants

| Fichier | Description |
|---------|-------------|
| `ai-service/pom.xml` | Dépendances Maven (LangChain4j, Ollama) |
| `ai-service/src/main/resources/application.properties` | Configuration (ports, Ollama URL) |
| `ai-service/src/main/resources/knowledge/` | Base de connaissances RAG |
| `NutritionKnowledgeService.java` | Gestion RAG |
| `GoalCalculationService.java` | Calcul objectifs |
| `RagChatController.java` | Endpoints chat |
| `EnhancedAgentController.java` | Endpoints agent |

### Variables d'Environnement (optionnelles)

```properties
# Dans application.properties
langchain4j.ollama.base-url=http://localhost:11434
langchain4j.ollama.chat-model.model-name=phi3
langchain4j.ollama.chat-model.temperature=0.7
```

---

## 🐛 Résolution des Problèmes

### Problème 1 : "Ollama non actif"

**Solution automatique :**
Le script propose de démarrer Ollama automatiquement. Répondez **O** (Oui).

**Solution manuelle :**
```powershell
# Terminal séparé
ollama serve
```

### Problème 2 : "Phi3 non trouvé"

**Solution automatique :**
Le script télécharge Phi3 automatiquement.

**Solution manuelle :**
```powershell
ollama pull phi3
```

### Problème 3 : "AI Service ne démarre pas"

**Vérifications :**
1. Ollama est actif : `ollama list`
2. Phi3 est installé : doit apparaître dans la liste
3. Port 8087 libre : `netstat -ano | findstr :8087`
4. Logs dans la fenêtre PowerShell du AI Service

**Si port 8087 occupé :**
```powershell
netstat -ano | findstr :8087
taskkill /PID <numero> /F
```

### Problème 4 : "Le chatbot ne répond pas"

**Checklist :**
- ✅ Backend actif : `curl http://localhost:8087/actuator/health`
- ✅ Ollama actif : `curl http://localhost:11434/api/tags`
- ✅ Frontend actif : Ouvrir http://localhost:4200
- ✅ Pas d'erreurs dans la console navigateur (F12)

---

## 📚 Documentation Complète

| Document | Description |
|----------|-------------|
| **START-EVERYTHING.ps1** | Script de démarrage automatique (CE FICHIER) |
| **GUIDE-DEMARRAGE-COMPLET.md** | Guide détaillé étape par étape |
| **VERIFICATION-COMPLETE.md** | Vérification technique RAG + Agent |
| **AI-CHAT-CORRECTIONS.md** | Détails du composant chatbot |
| **DEMARRAGE-README.md** | Guide rapide 3 commandes |
| **GUIDE-VISUEL.txt** | Schémas et flux de données |

---

## ✅ Résumé des Modifications

| Élément | Avant | Après |
|---------|-------|-------|
| **Port AI Service** | 8089 | 8087 |
| **Nom Service** | "AI Service" | "AI Service (RAG + Agent)" |
| **Vérification Ollama** | ❌ Absente | ✅ Automatique |
| **Installation Phi3** | ❌ Manuelle | ✅ Automatique |
| **Démarrage Ollama** | ❌ Manuel | ✅ Proposé |
| **Endpoints affichés** | ❌ Non | ✅ Oui |
| **Instructions chatbot** | ❌ Non | ✅ Oui |
| **Health check** | /api/health | /actuator/health |

---

## 🎉 TOUT EST PRÊT !

**Pour démarrer maintenant :**
```powershell
.\START-EVERYTHING.ps1
```

**Répondez "O" (Oui) à :**
- AI Service (RAG + Agent) ? **O**
- Frontend Angular ? **O**

**Puis testez :**
1. http://localhost:4200
2. Cliquer sur 🤖
3. Poser : "Qu'est-ce que le diabète ?"
4. Mode Agent → "🎯 Objectifs"

---

**Le système complet est opérationnel ! 🚀**

- ✅ RAG : Base de connaissances nutritionnelle
- ✅ Agent IA : Calcul objectifs personnalisés
- ✅ Chat : Interface conversationnelle
- ✅ Intégration : Mise à jour automatique de l'app

