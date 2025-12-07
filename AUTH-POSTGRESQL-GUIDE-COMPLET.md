# 🔐 GUIDE COMPLET - AUTHENTIFICATION AVEC POSTGRESQL

## 📋 Vue d'ensemble

Système d'authentification complet avec :
- ✅ **Backend** : Auth Service avec Spring Security + JWT + PostgreSQL
- ✅ **Frontend** : Pages Login et Register Angular
- ✅ **Base de données** : PostgreSQL au lieu de H2

---

## 🚀 ÉTAPE 1 : Installation de PostgreSQL

### Option 1 : Installation Windows

1. **Télécharger PostgreSQL** :
   - Aller sur https://www.postgresql.org/download/windows/
   - Télécharger l'installeur (version 15 ou 16)

2. **Installer** :
   - Exécuter l'installeur
   - Port par défaut : **5432**
   - Mot de passe postgres : **postgres** (ou autre)
   - Installer pgAdmin 4 (interface graphique)

3. **Vérifier l'installation** :
   ```powershell
   psql --version
   ```

### Option 2 : PostgreSQL avec Docker

```powershell
# Démarrer PostgreSQL dans Docker
docker run --name postgres-makla `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=makladb `
  -p 5432:5432 `
  -d postgres:15

# Vérifier que le conteneur tourne
docker ps
```

---

## 🗄️ ÉTAPE 2 : Créer la base de données

### Via pgAdmin (Interface graphique)

1. Ouvrir pgAdmin 4
2. Se connecter avec le mot de passe `postgres`
3. Clic droit sur "Databases" → "Create" → "Database"
4. Nom : **makladb**
5. Cliquer sur "Save"

### Via psql (Ligne de commande)

```bash
# Se connecter à PostgreSQL
psql -U postgres

# Créer la base de données
CREATE DATABASE makladb;

# Vérifier
\l

# Se connecter à la base
\c makladb

# Quitter
\q
```

### Via PowerShell (ligne de commande)

```powershell
# Créer la base de données
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -c "CREATE DATABASE makladb;"

# Lister les bases
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -c "\l"
```

---

## ⚙️ ÉTAPE 3 : Configuration du backend

### Fichier déjà configuré : `auth-service/src/main/resources/application.properties`

```properties
# PostgreSQL Configuration
spring.datasource.url=jdbc:postgresql://localhost:5432/makladb
spring.datasource.username=postgres
spring.datasource.password=postgres
spring.datasource.driver-class-name=org.postgresql.Driver
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect

# Hibernate auto-crée les tables
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

# JWT Configuration
jwt.secret=mySecretKeyForNutritionTrackingApplicationChangeThisInProduction
jwt.expiration=86400000
```

**Note** : Si votre mot de passe PostgreSQL est différent, modifiez `spring.datasource.password`

---

## 🔨 ÉTAPE 4 : Compiler et démarrer le backend

### Compilation de l'auth-service

```powershell
cd C:\Users\PC\IdeaProjects\projetmakla

# Compiler l'auth-service
.\mvnw.cmd clean package -DskipTests -pl auth-service -am
```

### Démarrer l'auth-service

```powershell
# Arrêter l'ancien auth-service s'il tourne
Get-Process java | Where-Object {$_.CommandLine -like "*auth-service*"} | Stop-Process -Force

# Démarrer le nouveau avec PostgreSQL
java -jar auth-service/target/auth-service-0.0.1-SNAPSHOT.jar
```

**Vérifier les logs** :
- Doit dire "Started AuthServiceApplication"
- Doit se connecter à PostgreSQL
- Table `users` créée automatiquement

### Vérifier la connexion PostgreSQL

```powershell
# Via psql
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d makladb -c "\dt"

# Devrait afficher la table 'users'
```

---

## 🎨 ÉTAPE 5 : Démarrer le frontend

```bash
cd C:\Users\PC\IdeaProjects\projetmakla\frontend

# Si pas déjà fait, installer les dépendances
npm install

# Démarrer
ng serve --open
```

**URL automatique** : http://localhost:4200

---

## 🧪 ÉTAPE 6 : Tester l'authentification

### 1. Accéder à la page d'inscription

```
http://localhost:4200/register
```

**Remplir le formulaire** :
- Prénom : Test
- Nom : User
- Username : testuser
- Email : test@makla.com
- Mot de passe : password123
- Confirmer : password123

**Cliquer sur** "Créer mon compte"

### 2. Vérification backend

Si tout fonctionne :
- ✅ Redirection automatique vers la page d'accueil
- ✅ Bouton "Déconnexion" visible en haut à droite
- ✅ Message "Bonjour, testuser"

### 3. Vérifier dans PostgreSQL

```bash
# Se connecter à la base
psql -U postgres -d makladb

# Voir les utilisateurs créés
SELECT id, username, email, first_name, last_name, role, enabled, created_at FROM users;

# Devrait afficher :
#  id | username | email           | first_name | last_name | role | enabled | created_at
# ----+----------+-----------------+------------+-----------+------+---------+------------
#  1  | testuser | test@makla.com  | Test       | User      | USER | t       | 2025-12-07...
```

### 4. Tester la connexion

- Se déconnecter (bouton "Déconnexion")
- Aller sur http://localhost:4200/login
- Se connecter avec :
  - Username : **testuser**
  - Password : **password123**
- Devrait rediriger vers la page d'accueil

---

## 📊 Architecture du système

```
┌─────────────┐
│   Frontend  │ (Angular - Port 4200)
│  Login/     │
│  Register   │
└──────┬──────┘
       │ HTTP POST /api/auth/login
       │ HTTP POST /api/auth/register
       ▼
┌──────────────┐
│ Auth Service │ (Spring Boot - Port 8081)
│  + JWT       │
└──────┬───────┘
       │ JDBC
       ▼
┌──────────────┐
│  PostgreSQL  │ (Port 5432)
│  Database    │
│  makladb     │
└──────────────┘
```

---

## 🔑 Endpoints API Auth Service

### POST /api/auth/register
**Créer un nouveau compte**

**Request Body** :
```json
{
  "username": "john",
  "email": "john@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response** :
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "username": "john",
  "message": "User registered successfully"
}
```

### POST /api/auth/login
**Se connecter**

**Request Body** :
```json
{
  "username": "john",
  "password": "password123"
}
```

**Response** :
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "username": "john",
  "message": "Login successful"
}
```

### GET /api/auth/validate
**Valider un token JWT**

**Headers** :
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response** :
```json
{
  "id": 1,
  "username": "john",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "USER",
  "enabled": true
}
```

---

## 🔐 Sécurité

### Hachage des mots de passe

Le service utilise **BCrypt** pour hasher les mots de passe :
- Le mot de passe en clair n'est jamais stocké
- Algorithme : BCrypt avec force 10
- Exemple : `password123` → `$2a$10$...` (60 caractères)

### JWT Token

**Structure du token** :
- **Header** : Algorithme (HS256)
- **Payload** : Username, role, expiration
- **Signature** : Signée avec la clé secrète

**Durée de validité** : 24 heures (86400000 ms)

**Stockage** :
- Frontend : localStorage (`token` et `currentUser`)
- Backend : Vérifie la signature à chaque requête

---

## 🐛 Dépannage

### Erreur : "Connection refused" PostgreSQL

**Problème** : PostgreSQL ne tourne pas

**Solution** :
```powershell
# Vérifier le service
Get-Service -Name postgresql*

# Démarrer le service
Start-Service postgresql-x64-15

# Ou via pgAdmin : clic droit sur le serveur → Start
```

### Erreur : "Database makladb does not exist"

**Solution** :
```bash
psql -U postgres -c "CREATE DATABASE makladb;"
```

### Erreur : "Authentication failed for user postgres"

**Problème** : Mauvais mot de passe

**Solution** :
1. Modifier `application.properties` :
   ```properties
   spring.datasource.password=VOTRE_MOT_DE_PASSE
   ```
2. Recompiler et redémarrer

### Erreur : "Role USER does not exist" dans PostgreSQL

**Solution** : C'est normal, `Role` est un enum Java, pas un rôle PostgreSQL

### Frontend : "Cannot connect to http://localhost:8081"

**Vérifier** :
1. Auth service démarre : `curl http://localhost:8081/api/auth/health`
2. Port 8081 libre : `netstat -ano | findstr :8081`
3. Logs du service Java

### Erreur CORS dans le frontend

**Solution** : Le backend a déjà la configuration CORS. Vérifier que :
- Auth service tourne sur 8081
- Frontend sur 4200
- Pas de proxy/firewall qui bloque

---

## 📝 Fichiers créés/modifiés

### Backend (2 fichiers)

1. **auth-service/src/main/resources/application.properties**
   - Configuration PostgreSQL activée
   - Configuration JWT

2. **auth-service/src/main/java/.../model/Role.java**
   - Enum créé

### Frontend (4 fichiers)

3. **frontend/src/app/services/auth.service.ts**
   - Service d'authentification
   - Gestion du token JWT
   - Login/Register/Logout

4. **frontend/src/app/pages/login/login.component.ts**
   - Page de connexion
   - Formulaire réactif
   - Validation

5. **frontend/src/app/pages/register/register.component.ts**
   - Page d'inscription
   - Formulaire avec validation
   - Confirmation mot de passe

6. **frontend/src/app/app.routes.ts**
   - Routes `/login` et `/register` ajoutées

7. **frontend/src/app/pages/home/home.component.ts**
   - Barre d'authentification ajoutée
   - Bouton login/logout

---

## ✅ Checklist de vérification

### Backend
- [ ] PostgreSQL installé et démarré
- [ ] Base de données `makladb` créée
- [ ] Auth service compilé sans erreur
- [ ] Auth service démarre et se connecte à PostgreSQL
- [ ] Table `users` créée automatiquement
- [ ] Endpoint `/api/auth/health` répond

### Frontend
- [ ] `ng serve` démarre sans erreur
- [ ] Page login accessible : http://localhost:4200/login
- [ ] Page register accessible : http://localhost:4200/register
- [ ] Formulaires s'affichent correctement
- [ ] Pas d'erreur dans la console navigateur

### Tests
- [ ] Inscription d'un utilisateur fonctionne
- [ ] Utilisateur visible dans PostgreSQL
- [ ] Connexion avec l'utilisateur fonctionne
- [ ] Token JWT stocké dans localStorage
- [ ] Redirection vers home après login
- [ ] Bouton déconnexion fonctionne
- [ ] Message "Bonjour, username" affiché

---

## 🚀 Démarrage complet de l'application

### Script PowerShell automatique

```powershell
# Démarrer tous les services
cd C:\Users\PC\IdeaProjects\projetmakla

# 1. Vérifier PostgreSQL
Write-Host "Vérification PostgreSQL..." -ForegroundColor Cyan
$pg = Get-Service -Name postgresql* -ErrorAction SilentlyContinue
if ($pg.Status -ne "Running") {
    Write-Host "⚠️ PostgreSQL n'est pas démarré!" -ForegroundColor Yellow
    Write-Host "Démarrez-le via pgAdmin ou : Start-Service postgresql-x64-15" -ForegroundColor Yellow
} else {
    Write-Host "✅ PostgreSQL actif" -ForegroundColor Green
}

# 2. Démarrer Eureka
Write-Host "`nDémarrage Eureka..." -ForegroundColor Cyan
Start-Process java -ArgumentList "-jar", "eureka-server\target\eureka-server-0.0.1-SNAPSHOT.jar" -WindowStyle Hidden
Start-Sleep -Seconds 15

# 3. Démarrer Gateway
Write-Host "Démarrage Gateway..." -ForegroundColor Cyan
Start-Process java -ArgumentList "-jar", "api-gateway\target\api-gateway-0.0.1-SNAPSHOT.jar" -WindowStyle Hidden
Start-Sleep -Seconds 15

# 4. Démarrer Auth Service (avec PostgreSQL)
Write-Host "Démarrage Auth Service (PostgreSQL)..." -ForegroundColor Cyan
Start-Process java -ArgumentList "-jar", "auth-service\target\auth-service-0.0.1-SNAPSHOT.jar" -WindowStyle Hidden
Start-Sleep -Seconds 15

# 5. Démarrer les autres services
Write-Host "Démarrage des autres services..." -ForegroundColor Cyan
Start-Process java -ArgumentList "-jar", "meal-service\target\meal-service-0.0.1-SNAPSHOT.jar" -WindowStyle Hidden
Start-Process java -ArgumentList "-jar", "water-service\target\water-service-0.0.1-SNAPSHOT.jar" -WindowStyle Hidden

Start-Sleep -Seconds 20

# 6. Démarrer le frontend
Write-Host "`nDémarrage du frontend..." -ForegroundColor Cyan
cd frontend
Start-Process npm -ArgumentList "start" -NoNewWindow

Write-Host "`n✅ Tous les services démarrés!" -ForegroundColor Green
Write-Host "`nURLs importantes:" -ForegroundColor Yellow
Write-Host "  Frontend : http://localhost:4200" -ForegroundColor Cyan
Write-Host "  Login    : http://localhost:4200/login" -ForegroundColor Cyan
Write-Host "  Register : http://localhost:4200/register" -ForegroundColor Cyan
Write-Host "  Eureka   : http://localhost:8761" -ForegroundColor Cyan
```

---

## 🎉 CONCLUSION

Vous avez maintenant un système d'authentification complet :

✅ **Backend sécurisé** avec Spring Security + JWT  
✅ **Base de données PostgreSQL** pour la production  
✅ **Frontend moderne** avec Angular  
✅ **Pages Login et Register** élégantes  
✅ **Gestion de session** avec localStorage  

**L'application Makla est prête avec authentification !** 🚀

---

*Guide créé le 7 Décembre 2025*  
*Auth Service avec PostgreSQL + JWT*  
*Frontend Angular avec Login/Register*

