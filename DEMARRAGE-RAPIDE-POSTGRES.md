# DEMARRAGE RAPIDE - AUTH SERVICE AVEC POSTGRESQL

**Date** : 7 Decembre 2025  
**Statut** : ✅ **SOLUTION TESTEE ET FONCTIONNELLE**

---

## ✅ COMMANDE QUI FONCTIONNE

### Demarrage auth-service avec PostgreSQL

```powershell
cd C:\Users\PC\IdeaProjects\projetmakla\auth-service
..\mvnw.cmd spring-boot:run '-Dspring-boot.run.profiles=postgres'
```

**⚠️ IMPORTANT** : Utilisez des **GUILLEMETS SIMPLES** `'` et NON des guillemets doubles `"`

---

## ❌ ERREURS COURANTES

### Erreur : "Unknown lifecycle phase .run.profiles=postgres"

**Cause** : Guillemets doubles ou absents

**Solutions qui NE FONCTIONNENT PAS** :
```powershell
# ❌ Sans guillemets
..\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=postgres

# ❌ Avec guillemets doubles
..\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=postgres"

# ❌ Avec backticks
..\mvnw.cmd spring-boot:run `"-Dspring-boot.run.profiles=postgres`"
```

**Solution qui FONCTIONNE** :
```powershell
# ✅ Avec guillemets simples
..\mvnw.cmd spring-boot:run '-Dspring-boot.run.profiles=postgres'
```

---

## 🚀 METHODES DE DEMARRAGE

### Methode 1 : Via Maven avec profil (RECOMMANDE POUR DEV)

```powershell
cd C:\Users\PC\IdeaProjects\projetmakla\auth-service
..\mvnw.cmd spring-boot:run '-Dspring-boot.run.profiles=postgres'
```

**Avantages** :
- Pas besoin de recompiler
- Hot reload si vous modifiez le code
- Idéal pour le développement

### Methode 2 : Via JAR compile (RECOMMANDE POUR PROD)

```powershell
# 1. Compiler si pas deja fait
cd C:\Users\PC\IdeaProjects\projetmakla
.\mvnw.cmd clean package -DskipTests -pl auth-service -am

# 2. Demarrer avec profil postgres
cd auth-service\target
java -Dspring.profiles.active=postgres -jar auth-service-0.0.1-SNAPSHOT.jar
```

**Avantages** :
- Plus rapide au démarrage
- Pas besoin de Maven au runtime
- Idéal pour la production

### Methode 3 : Via START-EVERYTHING.ps1 (RECOMMANDE POUR TOUT DEMARRER)

```powershell
cd C:\Users\PC\IdeaProjects\projetmakla
.\START-EVERYTHING.ps1
# Repondre 'O' quand demande pour Auth Service
```

**Avantages** :
- Demarre tous les services dans le bon ordre
- Verifie la sante de chaque service
- Gere automatiquement le profil postgres pour auth-service

---

## ✅ VERIFICATION

### 1. Verifier les logs au demarrage

Cherchez ces lignes dans la console :

```
The following 1 profile is active: "postgres"
```

```
HikariPool-1 - Starting...
HikariPool-1 - Added connection org.postgresql.jdbc.PgConnection@...
```

```
Hibernate: create table if not exists users ...
```

```
Started AuthServiceApplication in X.XXX seconds
```

### 2. Tester l'endpoint sante

```powershell
Invoke-RestMethod http://localhost:8081/api/auth/health
```

**Reponse attendue** : `Auth Service is running`

### 3. Verifier la table users dans PostgreSQL

```powershell
$env:PGPASSWORD = 'admin'
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -U postgres -d makladb -c "\dt"
Remove-Item Env:\PGPASSWORD
```

**Resultat attendu** :
```
 Schema | Nom   | Type  | Proprietaire 
--------+-------+-------+--------------
 public | users | table | postgres
```

---

## 👀 VOIR LES UTILISATEURS ENREGISTRES

### Methode 1 : Via pgAdmin (INTERFACE GRAPHIQUE - RECOMMANDE)

**pgAdmin** est l'interface graphique officielle de PostgreSQL.

1. **Ouvrir pgAdmin 4** (dans le menu Demarrer Windows)

2. **Se connecter au serveur** :
   - Serveur : PostgreSQL 18
   - Entrez le mot de passe : `admin`

3. **Naviguer vers la table users** :
   ```
   Servers → PostgreSQL 18 → Databases → makladb → Schemas → public → Tables → users
   ```

4. **Voir les donnees** :
   - Clic droit sur la table `users`
   - Choisir **"View/Edit Data"** → **"All Rows"**
   - Ou choisir **"Query Tool"** pour ecrire une requete SQL

5. **Requete SQL dans Query Tool** :
   ```sql
   SELECT id, username, email, first_name, last_name, role, enabled, created_at 
   FROM users 
   ORDER BY created_at DESC;
   ```

**Avantages** :
- ✅ Interface graphique intuitive
- ✅ Voir les donnees dans un tableau
- ✅ Filtrer, trier, exporter
- ✅ Executer des requetes SQL complexes

---

### Methode 2 : Via psql (LIGNE DE COMMANDE)

**psql** est l'outil en ligne de commande de PostgreSQL.

#### Option A : PowerShell avec psql

```powershell
# Definir le mot de passe
$env:PGPASSWORD = 'admin'

# Se connecter a la base makladb
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -U postgres -d makladb

# Nettoyer
Remove-Item Env:\PGPASSWORD
```

Une fois connecte, vous pouvez executer :

```sql
-- Voir toutes les tables
\dt

-- Voir la structure de la table users
\d users

-- Voir tous les utilisateurs
SELECT * FROM users;

-- Voir uniquement certains champs
SELECT id, username, email, role FROM users;

-- Compter le nombre d'utilisateurs
SELECT COUNT(*) FROM users;

-- Quitter psql
\q
```

#### Option B : Script PowerShell complet (RAPIDE)

Copiez/collez ce script dans PowerShell :

```powershell
$env:PGPASSWORD = 'admin'
$psql = 'C:\Program Files\PostgreSQL\18\bin\psql.exe'

Write-Host "`n=== UTILISATEURS DANS MAKLADB ===" -ForegroundColor Cyan
Write-Host ""

& $psql -U postgres -d makladb -c "SELECT id, username, email, first_name, last_name, role, enabled, created_at FROM users ORDER BY created_at DESC;"

Write-Host ""
Write-Host "=== STATISTIQUES ===" -ForegroundColor Yellow
& $psql -U postgres -d makladb -c "SELECT COUNT(*) as total_users FROM users;"
& $psql -U postgres -d makladb -c "SELECT role, COUNT(*) as count FROM users GROUP BY role;"

Remove-Item Env:\PGPASSWORD
```

---

### Methode 3 : Via l'API Auth Service

Vous pouvez aussi creer un endpoint dans le backend pour lister les utilisateurs (en developpement).

**Tester avec curl** :
```powershell
# Si vous avez un endpoint /api/auth/users (a creer)
Invoke-RestMethod http://localhost:8081/api/auth/users
```

---

## 📊 REQUETES SQL UTILES

Une fois connecte a psql ou dans pgAdmin Query Tool :

### Voir tous les utilisateurs
```sql
SELECT * FROM users;
```

### Voir uniquement les champs importants
```sql
SELECT id, username, email, first_name, last_name, role, enabled 
FROM users 
ORDER BY created_at DESC;
```

### Compter les utilisateurs
```sql
SELECT COUNT(*) as total FROM users;
```

### Compter par role
```sql
SELECT role, COUNT(*) as nombre 
FROM users 
GROUP BY role;
```

### Voir les utilisateurs actifs
```sql
SELECT username, email, role 
FROM users 
WHERE enabled = true;
```

### Chercher un utilisateur specifique
```sql
SELECT * FROM users 
WHERE username = 'testuser';
```

### Voir les 5 derniers utilisateurs inscrits
```sql
SELECT username, email, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 5;
```

### Voir uniquement les emails
```sql
SELECT email FROM users;
```

---

## 🔍 EXEMPLE COMPLET

Voici un script PowerShell complet pour voir vos utilisateurs :

```powershell
# Script pour afficher les utilisateurs de makladb
$env:PGPASSWORD = 'admin'
$psql = 'C:\Program Files\PostgreSQL\18\bin\psql.exe'

Write-Host ""
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   UTILISATEURS ENREGISTRES - MAKLADB   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Liste complete des utilisateurs
Write-Host "TOUS LES UTILISATEURS:" -ForegroundColor Yellow
& $psql -U postgres -d makladb -c "
SELECT 
    id,
    username,
    email,
    first_name || ' ' || last_name as nom_complet,
    role,
    CASE WHEN enabled THEN 'Actif' ELSE 'Inactif' END as statut,
    TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') as date_inscription
FROM users 
ORDER BY created_at DESC;
"

Write-Host ""
Write-Host "STATISTIQUES:" -ForegroundColor Yellow

# Total
Write-Host "Total d'utilisateurs:" -ForegroundColor White
& $psql -U postgres -d makladb -t -c "SELECT COUNT(*) FROM users;"

# Par role
Write-Host "`nRepartition par role:" -ForegroundColor White
& $psql -U postgres -d makladb -c "SELECT role, COUNT(*) as nombre FROM users GROUP BY role;"

# Actifs vs inactifs
Write-Host "`nUtilisateurs actifs:" -ForegroundColor White
& $psql -U postgres -d makladb -t -c "SELECT COUNT(*) FROM users WHERE enabled = true;"

Remove-Item Env:\PGPASSWORD

Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
```

**Pour l'utiliser** :
1. Copiez tout le script
2. Collez dans PowerShell
3. Appuyez sur Entree

---

## 🛠️ CREER UN SCRIPT REUTILISABLE

Creez un fichier `voir-users.ps1` :

```powershell
# voir-users.ps1
param(
    [string]$Password = "admin",
    [string]$Database = "makladb"
)

$env:PGPASSWORD = $Password
$psql = 'C:\Program Files\PostgreSQL\18\bin\psql.exe'

Write-Host "`n=== UTILISATEURS DE $Database ===" -ForegroundColor Cyan

& $psql -U postgres -d $Database -c "
    SELECT id, username, email, role, enabled, created_at 
    FROM users 
    ORDER BY created_at DESC;
"

Remove-Item Env:\PGPASSWORD
```

**Pour l'utiliser** :
```powershell
.\voir-users.ps1
# Ou avec un mot de passe different :
.\voir-users.ps1 -Password "mon_mdp"
```

---

## 🔧 TROUBLESHOOTING

### Probleme : "Connection refused"

**Cause** : PostgreSQL n'est pas demarre

**Solution** :
```powershell
Start-Service postgresql-x64-18
```

### Probleme : "password authentication failed"

**Cause** : Mot de passe incorrect

**Solution** :
Editer `auth-service/src/main/resources/application-postgres.properties` :
```properties
spring.datasource.password=VOTRE_MOT_DE_PASSE
```

### Probleme : "database makladb does not exist"

**Cause** : Base de donnees pas creee

**Solution** :
```powershell
$env:PGPASSWORD = 'admin'
& 'C:\Program Files\PostgreSQL\18\bin\createdb.exe' -U postgres makladb
Remove-Item Env:\PGPASSWORD
```

### Probleme : Auth-service utilise H2 au lieu de PostgreSQL

**Cause** : Profil postgres pas active

**Solution** : Verifier que vous utilisez bien `'-Dspring-boot.run.profiles=postgres'` avec guillemets simples

---

## 📋 CHECKLIST RAPIDE

Avant de demarrer :
- [ ] PostgreSQL installe et service Running
- [ ] Base `makladb` creee
- [ ] Mot de passe `admin` configure dans `application-postgres.properties`

Commande de demarrage :
```powershell
cd auth-service
..\mvnw.cmd spring-boot:run '-Dspring-boot.run.profiles=postgres'
```

Verification :
- [ ] Logs montrent "profile is active: postgres"
- [ ] Logs montrent "HikariPool" avec PostgreSQL
- [ ] http://localhost:8081/api/auth/health repond
- [ ] Table `users` existe dans `makladb`

---

## 🎯 EXEMPLE COMPLET

Voici un script complet pour demarrer auth-service :

```powershell
# Aller dans le dossier auth-service
cd C:\Users\PC\IdeaProjects\projetmakla\auth-service

# Arreter les anciens processus
Get-Process java -ErrorAction SilentlyContinue | 
    Where-Object { $_.CommandLine -like "*auth-service*" } | 
    Stop-Process -Force

# Attendre 2 secondes
Start-Sleep -Seconds 2

# Demarrer avec profil postgres
Write-Host "Demarrage auth-service avec PostgreSQL..." -ForegroundColor Green
..\mvnw.cmd spring-boot:run '-Dspring-boot.run.profiles=postgres'
```

---

## ✅ RESUME

**Commande correcte** :
```powershell
..\mvnw.cmd spring-boot:run '-Dspring-boot.run.profiles=postgres'
```

**Points cles** :
- ✅ Guillemets SIMPLES obligatoires : `'...'`
- ❌ PAS de guillemets doubles : `"..."`
- ❌ PAS de backticks : `` `"..."` ``
- ✅ Le profil s'appelle `postgres` (pas `postgresql`)

**CETTE SYNTAXE FONCTIONNE A 100% !** ✅

---

*Guide cree le 7 Decembre 2025*  
*Syntaxe testee et validee*  
*Fonctionne avec PowerShell 5.1 et PowerShell 7+*

