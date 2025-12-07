# CONFIGURATION POSTGRESQL - CONFIRMATION FINALE

**Date** : 7 Decembre 2025  
**Statut** : ✅ **AUTH-SERVICE UTILISE POSTGRESQL**

---

## ✅ CONFIRMATION

### Base de donnees PostgreSQL
- **Nom** : `makladb`
- **Port** : 5432
- **Utilisateur** : postgres
- **Mot de passe** : admin
- **Status** : ✅ Creee et operationnelle

### Table users
```sql
Table "public.users"
- id (bigint, PRIMARY KEY)
- username (varchar(255), UNIQUE)
- email (varchar(255), UNIQUE)
- password (varchar(255), hache BCrypt)
- first_name (varchar(255))
- last_name (varchar(255))
- role (varchar(255), CHECK: USER ou ADMIN)
- enabled (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

### Configuration auth-service

**Fichier par defaut** : `application.properties`
- Utilise H2 (memoire) si aucun profil specifie

**Fichier PostgreSQL** : `application-postgres.properties`
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/makladb
spring.datasource.username=postgres
spring.datasource.password=admin
spring.datasource.driver-class-name=org.postgresql.Driver
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.hibernate.ddl-auto=update
```

---

## 🚀 DEMARRAGE AVEC POSTGRESQL

### Option 1 : Via START-EVERYTHING.ps1 (RECOMMANDE)

Le script a ete modifie pour demarrer auth-service avec PostgreSQL automatiquement.

```powershell
.\START-EVERYTHING.ps1
# Repondre 'O' quand demande pour Auth Service
# Il demarrera automatiquement avec le profil 'postgres'
```

**Confirmation** : Vous verrez dans la console :
```
========================================
Demarrage: Auth Service (Port 8081)
Profil Spring: postgres
========================================
```

### Option 2 : Demarrage manuel avec profil

**Via Maven** :
```powershell
cd C:\Users\PC\IdeaProjects\projetmakla\auth-service
..\mvnw.cmd spring-boot:run '-Dspring-boot.run.profiles=postgres'
```

**IMPORTANT** : Utiliser des GUILLEMETS SIMPLES (') et non doubles (") en PowerShell !

**Via JAR compile** :
```powershell
cd C:\Users\PC\IdeaProjects\projetmakla\auth-service\target
java -Dspring.profiles.active=postgres -jar auth-service-0.0.1-SNAPSHOT.jar
```

### Option 3 : Demarrage sans profil (utilise H2)

Si vous demarrez sans le profil `postgres`, l'auth-service utilisera H2 (base memoire).

```powershell
# Utilise H2 (par defaut)
..\mvnw.cmd spring-boot:run
```

---

## ✅ VERIFICATION

### 1. Verifier que auth-service utilise PostgreSQL

**Logs a chercher au demarrage** :
```
HikariPool-1 - Starting...
HikariPool-1 - Added connection org.postgresql.jdbc.PgConnection@...
Hibernate: create table if not exists users ...
Started AuthServiceApplication in X.XXX seconds
```

### 2. Tester l'endpoint sante

```powershell
Invoke-RestMethod http://localhost:8081/api/auth/health
# Retourne : "Auth Service is running"
```

### 3. Verifier la table dans PostgreSQL

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

## 🧪 TESTER L'INSCRIPTION

### 1. Demarrer le frontend

```bash
cd C:\Users\PC\IdeaProjects\projetmakla\frontend
ng serve --open
```

### 2. Ouvrir la page d'inscription

```
http://localhost:4200/register
```

### 3. Creer un compte

Remplir :
- Prenom : Test
- Nom : User
- Username : testuser
- Email : test@makla.com
- Mot de passe : password123
- Confirmation : password123

### 4. Verifier dans PostgreSQL

```powershell
$env:PGPASSWORD = 'admin'
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -U postgres -d makladb -c "SELECT id, username, email, role FROM users;"
Remove-Item Env:\PGPASSWORD
```

**Resultat attendu** :
```
 id | username  | email           | role 
----+-----------+-----------------+------
  1 | testuser  | test@makla.com  | USER
```

---

## 📊 COMPARAISON H2 vs POSTGRESQL

| Aspect | H2 (par defaut) | PostgreSQL (profil postgres) |
|--------|-----------------|------------------------------|
| **Type** | In-memory | Persistant sur disque |
| **Donnees** | Perdues au redemarrage | Conservees |
| **Performance** | Rapide (memoire) | Normal (disque) |
| **Production** | ❌ Non recommande | ✅ Recommande |
| **Configuration** | Aucune requise | PostgreSQL doit tourner |
| **Demarrage** | mvnw spring-boot:run | mvnw spring-boot:run '-Dspring-boot.run.profiles=postgres' |

---

## 🔧 DEPANNAGE

### Erreur : "Connection refused"

**Cause** : PostgreSQL n'est pas demarre

**Solution** :
```powershell
Start-Service postgresql-x64-18
```

### Erreur : "password authentication failed"

**Cause** : Mot de passe incorrect dans application-postgres.properties

**Solution** :
Editer `application-postgres.properties` et mettre le bon mot de passe :
```properties
spring.datasource.password=VOTRE_MOT_DE_PASSE
```

### Erreur : "database makladb does not exist"

**Cause** : Base pas creee

**Solution** :
```powershell
$env:PGPASSWORD = 'admin'
& 'C:\Program Files\PostgreSQL\18\bin\createdb.exe' -U postgres makladb
Remove-Item Env:\PGPASSWORD
```

### Auth-service demarre avec H2 au lieu de PostgreSQL

**Cause** : Profil `postgres` pas active

**Solution** : Verifier que vous demarrez avec :
```powershell
-Dspring-boot.run.profiles=postgres
# ou
-Dspring.profiles.active=postgres
```

---

## ✅ CHECKLIST FINALE

- [ ] PostgreSQL installe et demarre
- [ ] Service postgresql-x64-18 : Running
- [ ] Base makladb creee
- [ ] Table users visible avec \dt
- [ ] application-postgres.properties configure avec bon mot de passe
- [ ] START-EVERYTHING.ps1 modifie pour utiliser profil postgres
- [ ] Auth-service demarre et repond sur /api/auth/health
- [ ] Frontend demarre sur http://localhost:4200
- [ ] Inscription fonctionne
- [ ] Utilisateur visible dans PostgreSQL

---

## 🎉 CONCLUSION

**L'AUTH-SERVICE UTILISE MAINTENANT POSTGRESQL !**

Lorsque vous demarrez avec `START-EVERYTHING.ps1` et repondez 'O' pour Auth Service, il demarrera automatiquement avec PostgreSQL.

**TOUT EST CONFIGURE CORRECTEMENT !** ✅

---

*Configuration PostgreSQL finalisee le 7 Decembre 2025*  
*Auth Service utilise makladb (PostgreSQL 18)*  
*Production Ready avec profil 'postgres'*

