# 🐘 Guide de démarrage avec PostgreSQL

## ✅ Modifications appliquées

Le script **START-EVERYTHING.ps1** utilise maintenant **PostgreSQL** pour auth-service.

---

## 📋 Prérequis AVANT de lancer le script

### 1. PostgreSQL doit être installé et démarré

**Vérifier si PostgreSQL est installé :**
```powershell
Get-Service -Name "postgresql*"
```

**Si pas installé, télécharger :**
- https://www.postgresql.org/download/windows/

### 2. Créer la base de données

**Ouvrir pgAdmin ou psql et exécuter :**
```sql
CREATE DATABASE makladb;
```

**OU avec psql en ligne de commande :**
```powershell
# Se connecter à PostgreSQL
psql -U postgres

# Créer la base de données
CREATE DATABASE makladb;

# Vérifier
\l

# Quitter
\q
```

### 3. Vérifier les identifiants PostgreSQL

Le fichier `application-postgres.properties` utilise :
- **URL :** `jdbc:postgresql://localhost:5432/makladb`
- **Username :** `postgres`
- **Password :** `admin`

**Si votre mot de passe est différent, modifiez :**
```
C:\Users\PC\IdeaProjects\projetmakla\auth-service\src\main\resources\application-postgres.properties
```

---

## 🚀 Démarrage

### Étape 1 : Démarrer PostgreSQL

```powershell
# Démarrer le service PostgreSQL
Start-Service postgresql-x64-15  # Ajustez le nom selon votre version
```

**OU via pgAdmin :** Démarrer le serveur PostgreSQL

### Étape 2 : Lancer le script

```powershell
cd C:\Users\PC\IdeaProjects\projetmakla
.\START-EVERYTHING.ps1
```

**Quand le script demande :**
```
Voulez-vous demarrer Auth Service? (O/N)
```
**Répondre : O**

Vous verrez :
```
Demarrage avec profil PostgreSQL...
Profil Spring: postgres
```

---

## 🧪 Vérification

### 1. Vérifier que le service utilise PostgreSQL

Dans les logs du auth-service, vous devriez voir :
```
HikariPool-1 - Starting...
HikariPool-1 - Added connection ... url=jdbc:postgresql://localhost:5432/makladb
```

### 2. Vérifier les utilisateurs créés

**Via psql :**
```sql
-- Se connecter à la base
psql -U postgres -d makladb

-- Lister les utilisateurs
SELECT username, email, role FROM users;

-- Vous devriez voir :
-- admin | admin@makla.com | ADMIN
-- user | user@makla.com | USER
-- nutritionist | nutritionist@makla.com | NUTRITIONIST
```

### 3. Tester la connexion

```powershell
curl -X POST http://localhost:8081/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"username\":\"admin\",\"password\":\"password\"}'
```

---

## 🔧 Dépannage

### Erreur : "Connection refused"

**Problème :** PostgreSQL n'est pas démarré

**Solution :**
```powershell
Start-Service postgresql-x64-15
```

### Erreur : "database 'makladb' does not exist"

**Problème :** La base de données n'a pas été créée

**Solution :**
```powershell
psql -U postgres
CREATE DATABASE makladb;
\q
```

### Erreur : "password authentication failed"

**Problème :** Le mot de passe dans application-postgres.properties ne correspond pas

**Solution :**
1. Ouvrir `auth-service\src\main\resources\application-postgres.properties`
2. Modifier la ligne :
   ```
   spring.datasource.password=VOTRE_MOT_DE_PASSE
   ```
3. Recompiler :
   ```powershell
   .\mvnw.cmd clean package -DskipTests -pl auth-service
   ```

### Erreur : "FATAL: role 'postgres' does not exist"

**Problème :** L'utilisateur PostgreSQL n'existe pas

**Solution :** Créer l'utilisateur ou modifier le username dans application-postgres.properties

---

## 📊 Configuration PostgreSQL actuelle

| Paramètre | Valeur |
|-----------|--------|
| **Database** | makladb |
| **Host** | localhost |
| **Port** | 5432 |
| **Username** | postgres |
| **Password** | admin |
| **DDL** | update (crée/met à jour les tables automatiquement) |

---

## 🔄 Basculer entre H2 et PostgreSQL

### Pour utiliser H2 (base de données en mémoire)

Modifiez temporairement START-EVERYTHING.ps1 :
```powershell
# Retirer le paramètre -SpringProfile "postgres"
Start-Service -Name "Auth Service" -Path "auth-service" -Port 8081 -HealthUrl "http://localhost:8081/actuator/health"
```

**OU** démarrez manuellement sans profil :
```powershell
cd C:\Users\PC\IdeaProjects\projetmakla\auth-service
java -jar target\auth-service-0.0.1-SNAPSHOT.jar
# (sans --spring.profiles.active=postgres)
```

### Pour utiliser PostgreSQL (actuel)

Le script est déjà configuré ! Lancez simplement :
```powershell
.\START-EVERYTHING.ps1
```

---

## ✅ Avantages de PostgreSQL

- ✅ **Données persistantes** - Les utilisateurs restent après redémarrage
- ✅ **Production-ready** - Base de données robuste
- ✅ **Performances** - Meilleur pour beaucoup de données
- ✅ **Requêtes avancées** - Support SQL complet

---

## 🎯 Prochaines étapes

1. **Démarrer PostgreSQL**
2. **Créer la base makladb**
3. **Lancer .\START-EVERYTHING.ps1**
4. **Répondre O pour Auth Service**
5. **Tester le login sur http://localhost:4200**

---

**Le script START-EVERYTHING.ps1 utilise maintenant PostgreSQL ! 🐘**

