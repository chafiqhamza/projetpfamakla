# 🔍 DIAGNOSTIC : Erreur 404 et Performance du Service AI

## 🚨 Problème Rencontré

Vous voyez l'erreur **Whitelabel Error Page (404)** quand vous essayez d'accéder au service.

```
Whitelabel Error Page
This application has no explicit mapping for /error
Status=404, Not Found
```

---

## ✅ EXPLICATION

### Cause de l'Erreur 404

L'erreur 404 apparaît dans **DEUX situations** :

#### 1️⃣ Accès à un Endpoint Inexistant
Si vous essayez d'accéder à :
- ❌ `http://localhost:8087/` (racine)
- ❌ `http://localhost:8087/error`
- ❌ `http://localhost:8087/api/rag/chat` (mauvais chemin)

**Solution** : Utilisez les **bons endpoints** (voir ci-dessous)

#### 2️⃣ Service Démarre Encore
Le service AI est **en cours de démarrage** et charge la base de connaissances.
Pendant ce temps (~30-60 secondes), tous les endpoints peuvent retourner 404.

---

## 📍 ENDPOINTS CORRECTS

### ✅ Endpoints Disponibles

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/chat/rag` | POST | Chat avec RAG |
| `/api/agent/analyze-profile` | POST | Analyse de profil |
| `/api/agent/update-goals` | POST | Mise à jour des objectifs |
| `/api/agent/calculate-goals` | POST | Calcul des objectifs |

⚠️ **IMPORTANT** : Le chemin est `/api/chat/rag` et **NON** `/api/rag/chat`

---

## 🧪 TESTS

### Test 1 : Vérifier que le Service Répond

```powershell
# Vérifier le port
netstat -ano | Select-String "8087" | Select-String "LISTENING"

# Doit afficher:
# TCP    0.0.0.0:8087    LISTENING
```

### Test 2 : Chat RAG (Endpoint Principal)

```powershell
# Test simple
$body = @{
    message = "Bonjour"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8087/api/chat/rag" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body `
    -TimeoutSec 60
```

**Réponse Attendue** :
```json
{
  "success": true,
  "response": "Bonjour! Comment puis-je vous aider...",
  "intent": "greeting",
  "requiresUserChoice": false,
  "suggestedActions": []
}
```

### Test 3 : Calcul d'Objectifs

```powershell
$body = @{
    age = 30
    weight = 70
    height = 175
    gender = "male"
    activityLevel = "moderate"
    goal = "maintain"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8087/api/agent/calculate-goals" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

---

## ⏱️ TEMPS DE RÉPONSE

### Première Requête (Lente)
- **Durée** : 30-90 secondes
- **Raison** : Ollama charge le modèle Phi3 en mémoire
- **Status** : Normal

### Requêtes Suivantes (Rapides)
- **Durée** : 2-5 secondes
- **Raison** : Modèle déjà en mémoire
- **Status** : Normal

---

## 🔧 SOLUTIONS AUX PROBLÈMES COURANTS

### Problème 1 : 404 sur Tous les Endpoints

**Causes Possibles** :
1. ❌ Service pas encore démarré complètement
2. ❌ Controllers pas chargés correctement
3. ❌ Erreur au démarrage

**Solution** :
```powershell
# 1. Arrêter tous les processus Java
Get-Process -Name java | Stop-Process -Force

# 2. Relancer le service
cd E:\projetpfamakla-main\projetpfamakla-main\ai-service
java -jar target\ai-service-0.0.1-SNAPSHOT.jar

# 3. Attendre 30 secondes
Start-Sleep -Seconds 30

# 4. Tester
$body = '{"message":"test"}'
Invoke-RestMethod -Uri "http://localhost:8087/api/chat/rag" -Method POST -ContentType "application/json" -Body $body
```

### Problème 2 : Requête Bloque Indéfiniment

**Cause** : Ollama ne répond pas

**Solution** :
```powershell
# 1. Vérifier Ollama
curl http://localhost:11434/api/tags

# Si ça ne répond pas:
# Redémarrer Ollama
Stop-Process -Name ollama* -Force
Start-Process "ollama" -ArgumentList "serve"

# Attendre 10 secondes
Start-Sleep -Seconds 10

# Vérifier le modèle
ollama list
# Doit montrer: phi3

# Si phi3 n'est pas là:
ollama pull phi3
```

### Problème 3 : Erreur 500 (Internal Server Error)

**Cause** : Problème avec le service ou Ollama

**Solution** :
1. Vérifier les logs du service AI
2. Vérifier qu'Ollama fonctionne
3. Redémarrer les deux services

---

## 📊 VÉRIFICATION COMPLÈTE

### Script de Vérification Automatique

Créez un fichier `test-ai-service.ps1` :

```powershell
Write-Host "=== TEST AI SERVICE ===" -ForegroundColor Cyan

# 1. Port
Write-Host "`n1. Port 8087..." -ForegroundColor Yellow
$port = netstat -ano | Select-String "8087" | Select-String "LISTENING"
if ($port) {
    Write-Host "   OK - Service ecoute sur le port 8087" -ForegroundColor Green
} else {
    Write-Host "   ERREUR - Port 8087 non ouvert" -ForegroundColor Red
    exit 1
}

# 2. Ollama
Write-Host "`n2. Ollama (port 11434)..." -ForegroundColor Yellow
try {
    $ollama = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -TimeoutSec 5
    Write-Host "   OK - Ollama repond" -ForegroundColor Green
} catch {
    Write-Host "   ERREUR - Ollama ne repond pas" -ForegroundColor Red
    Write-Host "   Lancez: ollama serve" -ForegroundColor Yellow
    exit 1
}

# 3. Endpoint Chat RAG
Write-Host "`n3. Endpoint /api/chat/rag..." -ForegroundColor Yellow
try {
    $body = '{"message":"test"}'
    $response = Invoke-RestMethod -Uri "http://localhost:8087/api/chat/rag" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -TimeoutSec 60
    
    if ($response.success) {
        Write-Host "   OK - Chat RAG fonctionne" -ForegroundColor Green
        Write-Host "   Reponse: $($response.response.Substring(0, [Math]::Min(50, $response.response.Length)))..." -ForegroundColor Gray
    } else {
        Write-Host "   AVERTISSEMENT - Reponse recue mais success=false" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ERREUR - $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Message -match "404") {
        Write-Host "   Utilisez /api/chat/rag et non /api/rag/chat" -ForegroundColor Yellow
    }
}

Write-Host "`n=== TEST TERMINE ===" -ForegroundColor Cyan
```

**Exécution** :
```powershell
.\test-ai-service.ps1
```

---

## 🎯 RÉSUMÉ

### État Actuel du Service
- ✅ Service AI compilé et déployé
- ✅ Port 8087 actif
- ✅ Ollama en cours d'exécution
- ⚠️ Première requête peut être lente (30-90s)

### Endpoints à Utiliser
```
POST http://localhost:8087/api/chat/rag
POST http://localhost:8087/api/agent/calculate-goals
POST http://localhost:8087/api/agent/analyze-profile
```

### Erreur 404 : Raisons Principales
1. ❌ Mauvais endpoint (ex: `/` au lieu de `/api/chat/rag`)
2. ❌ Service encore en train de démarrer
3. ❌ Controllers non chargés

### Solution Rapide
```powershell
# Attendre que le service démarre complètement
Start-Sleep -Seconds 30

# Tester avec le bon endpoint
$body = '{"message":"Bonjour"}'
Invoke-RestMethod -Uri "http://localhost:8087/api/chat/rag" -Method POST -ContentType "application/json" -Body $body -TimeoutSec 60
```

---

## 📞 AIDE SUPPLÉMENTAIRE

Si le problème persiste :

1. **Vérifier les logs du service** (dans le terminal où vous l'avez lancé)
2. **Redémarrer Ollama** : `ollama serve`
3. **Reconstruire le service** : `mvnw clean package -DskipTests`
4. **Tester avec Postman** ou un autre client REST

---

**Date** : 15 décembre 2025, 19:52
**Status** : Service actif, endpoints disponibles
**Note** : Première requête lente (normal)

