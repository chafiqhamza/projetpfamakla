# Scripts de Gestion des Services Makla

## Scripts Disponibles

### 1. START-ALL-AUTO.ps1
**Description:** Demarre automatiquement tous les services Spring Boot dans le bon ordre.

**Usage:**
```powershell
.\START-ALL-AUTO.ps1
```

**Ce qu'il fait:**
- Verifie si des ports sont deja utilises
- Propose d'arreter les processus Java existants
- Demarre les services dans cet ordre:
  1. Eureka Server (port 8761) - Attend 25s
  2. API Gateway (port 8080) - Attend 15s
  3. Auth Service (port 8081) - Attend 5s
  4. Food Service (port 8083) - Attend 10s
  5. Meal Service (port 8084) - Attend 10s
  6. Water Service (port 8085) - Attend 10s

**Temps total:** ~75 secondes pour tout demarrer

---

### 2. START-FRONTEND.ps1
**Description:** Demarre le frontend Angular.

**Usage:**
```powershell
.\START-FRONTEND.ps1
```

**Ce qu'il fait:**
- Verifie Node.js et npm
- Installe les dependances si necessaire (npm install)
- Demarre le serveur Angular (npm start)
- Ouvre sur http://localhost:4200

---

### 3. STOP-ALL-SERVICES.ps1
**Description:** Arrete tous les services Java en cours.

**Usage:**
```powershell
.\STOP-ALL-SERVICES.ps1
```

**Ce qu'il fait:**
- Liste tous les processus Java
- Demande confirmation
- Arrete tous les processus Java
- Verifie que les ports sont liberes

---

### 4. TEST-SERVICES.ps1
**Description:** Teste la connectivite de tous les services.

**Usage:**
```powershell
.\TEST-SERVICES.ps1
```

**Ce qu'il fait:**
- Teste Eureka Server
- Teste API Gateway
- Teste tous les microservices (direct et via Gateway)
- Affiche un rapport detaille

---

## Workflow Complet

### Demarrage Initial
```powershell
# 1. Arreter les anciens services (si necessaire)
.\STOP-ALL-SERVICES.ps1

# 2. Demarrer tous les services backend
.\START-ALL-AUTO.ps1

# 3. Attendre ~75 secondes

# 4. Tester que tout fonctionne
.\TEST-SERVICES.ps1

# 5. Demarrer le frontend
.\START-FRONTEND.ps1
```

### Verification Rapide
```powershell
# Tester les services
.\TEST-SERVICES.ps1
```

### Arret
```powershell
# Arreter tout
.\STOP-ALL-SERVICES.ps1
```

---

## URLs Importantes

| Service | URL |
|---------|-----|
| Eureka Dashboard | http://localhost:8761 |
| API Gateway | http://localhost:8080 |
| Food Service | http://localhost:8083/api/foods |
| Meal Service | http://localhost:8084/api/meals |
| Water Service | http://localhost:8085/api/water |
| Frontend Angular | http://localhost:4200 |

---

## Troubleshooting

### Probleme: Port deja utilise
```powershell
.\STOP-ALL-SERVICES.ps1
```

### Probleme: Service ne demarre pas
- Verifier les logs dans la fenetre PowerShell du service
- Verifier qu'Eureka est bien demarre (http://localhost:8761)
- Attendre 30-60 secondes supplementaires

### Probleme: Frontend ne se connecte pas
- Verifier que l'API Gateway est demarre (http://localhost:8080/actuator/health)
- Verifier les services dans Eureka (http://localhost:8761)
- Executer `.\TEST-SERVICES.ps1`

### Probleme: Erreur de compilation Java
Le projet necessite Java 17 ou 21. Si vous avez Java 25:
1. Ouvrir IntelliJ IDEA
2. File → Project Structure → Project
3. SDK: Download JDK → Version 17
4. Build → Build Project

---

## Notes

- **Ordre important:** Toujours demarrer Eureka en premier
- **Temps d'attente:** Les services ont besoin de 30-60s pour s'enregistrer dans Eureka
- **Ports requis:** 4200, 8080, 8081, 8082, 8083, 8084, 8085, 8761, 8888
- **Memoire:** Chaque service utilise ~200-500 MB de RAM

---

## Support

En cas de probleme:
1. Consulter les logs dans les fenetres PowerShell
2. Verifier Eureka Dashboard: http://localhost:8761
3. Executer `.\TEST-SERVICES.ps1` pour diagnostiquer
4. Utiliser la page Diagnostic dans l'application: http://localhost:4200

---

**Derniere mise a jour:** 2025-12-07

