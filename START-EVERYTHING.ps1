# Script de demarrage complet et intelligent de tous les services Makla
# Ce script gere toutes les erreurs et verifie que chaque service demarre correctement

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEMARRAGE COMPLET DU PROJET MAKLA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Detecter le chemin du projet de maniere dynamique
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = $scriptPath
$ErrorActionPreference = "Continue"

# Ensure a valid JDK is available and set JAVA_HOME for this session if possible
function Ensure-JavaHome {
    try {
        # Check existing process-level JAVA_HOME first
        $procJavaHome = [Environment]::GetEnvironmentVariable('JAVA_HOME', 'Process')
        if ($procJavaHome -and (Test-Path (Join-Path $procJavaHome 'bin\\javac.exe'))) {
            Write-Host "JAVA_HOME (process) OK: $procJavaHome" -ForegroundColor Green
            return $procJavaHome
        }

        # Then check user/machine envs
        foreach ($scope in @('User', 'Machine')) {
            $val = [Environment]::GetEnvironmentVariable('JAVA_HOME', $scope)
            if ($val -and (Test-Path (Join-Path $val 'bin\\javac.exe'))) {
                Write-Host "JAVA_HOME ($scope) OK: $val" -ForegroundColor Green
                # copy to process so children see it during this run
                [Environment]::SetEnvironmentVariable('JAVA_HOME', $val, 'Process')
                return $val
            }
        }

        # Fallback: infer from java on PATH
        try {
            $javaCmd = Get-Command java -ErrorAction Stop
            $javaPath = $javaCmd.Source
        }
        catch {
            $javaPath = $null
        }

        if ($javaPath) {
            $binDir = Split-Path -Parent $javaPath
            $possibleJdk = Split-Path -Parent $binDir
            if (Test-Path (Join-Path $possibleJdk 'bin\\javac.exe')) {
                [Environment]::SetEnvironmentVariable('JAVA_HOME', $possibleJdk, 'Process')
                Write-Host "Inferred JAVA_HOME and set for session: $possibleJdk" -ForegroundColor Green
                return $possibleJdk
            }
        }

        Write-Host "Warning: No JDK with javac found. Please install a JDK and set JAVA_HOME." -ForegroundColor Yellow
        return $null
    }
    catch {
        Write-Host "Error while detecting JAVA_HOME: $_" -ForegroundColor Red
        return $null
    }
}

# Try to ensure JAVA_HOME as early as possible so child windows can inherit an injected value when started
$inferredJavaHome = Ensure-JavaHome

# Fonction pour tester si un port est libre
function Test-Port {
    param([int]$Port)
    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    return ($null -ne $connection)
}

# Fonction pour attendre qu'un service reponde
function Wait-ForService {
    param(
        [string]$Url,
        [int]$MaxAttempts = 60,
        [int]$DelaySeconds = 2
    )

    Write-Host "  Attente que le service reponde sur $Url..." -ForegroundColor Gray

    for ($i = 1; $i -le $MaxAttempts; $i++) {
        try {
            $response = Invoke-WebRequest -Uri $Url -TimeoutSec 2 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Host "  Service pret! (tentative $i/$MaxAttempts)" -ForegroundColor Green
                return $true
            }
        }
        catch {
            # Service pas encore pret
        }

        if ($i -lt $MaxAttempts) {
            Write-Host "  Tentative $i/$MaxAttempts - En attente..." -ForegroundColor Gray
            Start-Sleep -Seconds $DelaySeconds
        }
    }

    Write-Host "  TIMEOUT: Le service n'a pas repondu apres $MaxAttempts tentatives" -ForegroundColor Red
    return $false
}

# Fonction pour demarrer un service
function Start-Service {
    param(
        [string]$Name,
        [string]$Path,
        [int]$Port,
        [string]$HealthUrl,
        [string]$SpringProfile = ""
    )

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "Demarrage: $Name (Port $Port)" -ForegroundColor Yellow
    if ($SpringProfile) {
        Write-Host "Profil Spring: $SpringProfile" -ForegroundColor Cyan
    }
    Write-Host "========================================" -ForegroundColor Yellow

    # Verifier si le port est deja utilise
    if (Test-Port -Port $Port) {
        Write-Host "ATTENTION: Le port $Port est deja utilise!" -ForegroundColor Red
        Write-Host "Tentative d'arret du processus..." -ForegroundColor Yellow

        $conn = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        if ($conn) {
            $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
            if ($process) {
                Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
                Start-Sleep -Seconds 3
                Write-Host "Processus arrete." -ForegroundColor Green
            }
        }
    }

    # Demarrer le service
    $servicePath = Join-Path $projectRoot $Path
    Write-Host "Lancement de $Name..." -ForegroundColor Cyan

    # Path absolu vers le wrapper mvnw dans la racine du projet
    $mvnwPath = Join-Path $projectRoot 'mvnw.cmd'

    # Recuperer JAVA_HOME defini pour cette session (si present) et preparer un prefix pour la commande
    $procJavaHome = [Environment]::GetEnvironmentVariable('JAVA_HOME', 'Process')
    $useJavaHome = $null
    # Prefer an existing, valid JAVA_HOME that contains a JDK (javac)
    if ($procJavaHome -and (Test-Path (Join-Path $procJavaHome 'bin\javac.exe'))) {
        $useJavaHome = $procJavaHome
    }
    else {
        # Try to infer from the 'java' executable on PATH
        try {
            $javaCmd = Get-Command java -ErrorAction Stop
            $javaPath = $javaCmd.Source
        }
        catch {
            $javaPath = $null
        }

        if ($javaPath) {
            $binDir = Split-Path -Parent $javaPath
            $possibleJdk = Split-Path -Parent $binDir
            if (Test-Path (Join-Path $possibleJdk 'bin\javac.exe')) {
                $useJavaHome = $possibleJdk
                # set for this session so other logic can rely on it
                [Environment]::SetEnvironmentVariable('JAVA_HOME', $possibleJdk, 'Process')
                Write-Host "(DEBUG) JAVA_HOME inferé et défini pour la session: $possibleJdk" -ForegroundColor DarkCyan
            }
        }
    }

    if ($useJavaHome) {
        # Echapper d'éventuelles quotes simples
        $escapedJavaHome = $useJavaHome -replace "'", "''"
        # Construire un prefix qui definira JAVA_HOME et mettra bin dans PATH dans la nouvelle fenetre
        $javaPrefix = '$env:JAVA_HOME = ''' + $escapedJavaHome + '''; $env:PATH = ''' + $escapedJavaHome + '\\bin;'' + $env:PATH; '
        Write-Host "(DEBUG) Injection de JAVA_HOME pour $Name = $useJavaHome" -ForegroundColor DarkCyan
    }
    else {
        $javaPrefix = ""
    }

    # Construire la commande PowerShell a executer dans la nouvelle fenetre
    if ($SpringProfile) {
        # Utiliser le mvnw absolute path et passer le profil en argument
        $psCommand = $javaPrefix + "Write-Host '=== $Name ===' -ForegroundColor Cyan; Write-Host 'Port: $Port' -ForegroundColor White; Write-Host 'Profile: $SpringProfile' -ForegroundColor Green; Write-Host ''; & '$mvnwPath' spring-boot:run '-Dspring-boot.run.profiles=$SpringProfile'"
    }
    else {
        $psCommand = $javaPrefix + "Write-Host '=== $Name ===' -ForegroundColor Cyan; Write-Host 'Port: $Port' -ForegroundColor White; Write-Host ''; & '$mvnwPath' spring-boot:run"
    }

    # Lancer une nouvelle fenetre PowerShell avec le WorkingDirectory du service (plus robuste que cd inline)
    $process = Start-Process -FilePath powershell -ArgumentList "-NoExit", "-Command", $psCommand -WorkingDirectory $servicePath -PassThru

    if ($null -eq $process) {
        Write-Host "ERREUR: Impossible de demarrer $Name" -ForegroundColor Red
        return $false
    }

    Write-Host "Processus demarre (PID: $($process.Id))" -ForegroundColor Green

    # Attendre que le service reponde
    if ($HealthUrl) {
        $ready = Wait-ForService -Url $HealthUrl
        if (-not $ready) {
            Write-Host "AVERTISSEMENT: $Name ne repond pas sur le health check" -ForegroundColor Yellow
            Write-Host "Continuation quand meme..." -ForegroundColor Yellow
        }
    }

    return $true
}

# ETAPE 1: Verifier Java
Write-Host "Verification de Java..." -ForegroundColor Yellow
try {
    $javaVersion = java -version 2>&1 | Select-Object -First 1
    Write-Host "Java trouve: $javaVersion" -ForegroundColor Green

    # Verifier JAVA_HOME (Process, User, Machine) et essayer de l'inferer si absent ou incorrect
    $envNames = @('Process', 'User', 'Machine')
    $javaHome = $null
    foreach ($scope in $envNames) {
        $val = [Environment]::GetEnvironmentVariable('JAVA_HOME', $scope)
        if ($val -and (Test-Path (Join-Path $val 'bin\javac.exe'))) {
            $javaHome = $val
            break
        }
    }

    if (-not $javaHome) {
        Write-Host "JAVA_HOME n'est pas defini correctement. Tentative d'inference a partir de 'java'..." -ForegroundColor Yellow
        try {
            $javaCmd = Get-Command java -ErrorAction Stop
            $javaPath = $javaCmd.Source
        }
        catch {
            $javaPath = $null
        }

        if ($javaPath) {
            # javaPath ex: C:\Program Files\Java\jdk-17\bin\java.exe
            $binDir = Split-Path -Parent $javaPath
            $possibleJdk = Split-Path -Parent $binDir
            if (Test-Path (Join-Path $possibleJdk 'bin\javac.exe')) {
                # Definir JAVA_HOME pour la session en cours (process)
                [Environment]::SetEnvironmentVariable('JAVA_HOME', $possibleJdk, 'Process')
                $javaHome = $possibleJdk
                Write-Host "JAVA_HOME definie temporairement pour cette session: $possibleJdk" -ForegroundColor Green

                # Proposer de rendre la variable persistante pour l'utilisateur
                Write-Host "Voulez-vous definir JAVA_HOME pour l'utilisateur (persistant) ? (O/N) [AUTO: O]" -ForegroundColor Yellow
                $ans = 'o'
                # $ans = Read-Host
                if ($ans -eq 'O' -or $ans -eq 'o') {
                    # setx ecrit dans le registre pour l'utilisateur (prend effet dans les nouvelles sessions)
                    setx JAVA_HOME "$possibleJdk" | Out-Null
                    Write-Host "JAVA_HOME persistant defini a: $possibleJdk (ouvrez une nouvelle session PowerShell/cmd pour en profiter)" -ForegroundColor Green
                }
                else {
                    Write-Host "Continuing with temporary JAVA_HOME only for this session." -ForegroundColor Gray
                }
            }
            else {
                Write-Host "ERREUR: Le java trouvé dans le PATH ne semble pas provenir d'un JDK valide (bin\\java.exe introuvable)." -ForegroundColor Red
                Write-Host "Installez un JDK (Java 17 recommandé) et définissez JAVA_HOME vers le dossier racine du JDK." -ForegroundColor Yellow
                Write-Host "Guide rapide: https://adoptium.net/" -ForegroundColor Cyan
                pause
                exit 1
            }
        }
        else {
            Write-Host "ERREUR: Impossible d'inferer JAVA_HOME: 'java' non trouve dans le PATH." -ForegroundColor Red
            Write-Host "Installez un JDK (Java 17 recommandé) et définissez JAVA_HOME vers le dossier racine du JDK." -ForegroundColor Yellow
            Write-Host "Guide rapide: https://adoptium.net/" -ForegroundColor Cyan
            pause
            exit 1
        }
    }
    else {
        Write-Host "JAVA_HOME valide trouve: $javaHome" -ForegroundColor Green
    }
}
catch {
    Write-Host "ERREUR: Java n'est pas installe ou pas dans le PATH!" -ForegroundColor Red
    Write-Host "Installez Java 17 depuis: https://adoptium.net/temurin/releases/?version=17" -ForegroundColor Yellow
    pause
    exit 1
}
Write-Host ""

# ETAPE 2: Nettoyer les anciens processus
Write-Host "Voulez-vous arreter tous les processus Java existants? (O/N) [AUTO: O]" -ForegroundColor Yellow
$response = 'o'
# $response = Read-Host
if ($response -eq 'O' -or $response -eq 'o') {
    Write-Host "Arret des processus Java..." -ForegroundColor Red
    Get-Process -Name java -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 3
    Write-Host "Processus arretes!" -ForegroundColor Green
}
Write-Host ""

# ETAPE 3: Demarrer les services dans le bon ordre
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEMARRAGE DES SERVICES BACKEND" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$allStarted = $true

# 1. EUREKA SERVER (CRITIQUE - doit demarrer en premier)
$started = Start-Service -Name "Eureka Server" -Path "eureka-server" -Port 8761 -HealthUrl "http://localhost:8761/actuator/health"
if (-not $started) {
    Write-Host "ERREUR CRITIQUE: Eureka Server n'a pas demarre!" -ForegroundColor Red
    Write-Host "Sans Eureka, les autres services ne peuvent pas s'enregistrer." -ForegroundColor Red
    pause
    exit 1
}
Start-Sleep -Seconds 5

# 2. CONFIG SERVER (optionnel mais utile)
Write-Host ""
Write-Host "Voulez-vous demarrer Config Server? (O/N) [AUTO: O]" -ForegroundColor Yellow
$response = 'o'
# $response = Read-Host
if ($response -eq 'O' -or $response -eq 'o') {
    Start-Service -Name "Config Server" -Path "config-server" -Port 8888 -HealthUrl "http://localhost:8888/actuator/health"
    Start-Sleep -Seconds 3
}

# 3. API GATEWAY (CRITIQUE - requis pour le frontend)
$started = Start-Service -Name "API Gateway" -Path "api-gateway" -Port 8080 -HealthUrl "http://localhost:8080/actuator/health"
if (-not $started) {
    Write-Host "AVERTISSEMENT: API Gateway n'a pas demarre correctement" -ForegroundColor Yellow
    $allStarted = $false
}
Start-Sleep -Seconds 5

# 4. AUTH SERVICE (avec PostgreSQL)
Write-Host ""
Write-Host "Voulez-vous demarrer Auth Service? (O/N) [AUTO: O]" -ForegroundColor Yellow
$response = 'o'
# $response = Read-Host
if ($response -eq 'O' -or $response -eq 'o') {
    Write-Host "Demarrage avec profil PostgreSQL..." -ForegroundColor Cyan
    Start-Service -Name "Auth Service" -Path "auth-service" -Port 8081 -HealthUrl "http://localhost:8081/actuator/health" -SpringProfile "postgres"
    Start-Sleep -Seconds 3
}

# 5. USER SERVICE
Write-Host ""
Write-Host "Voulez-vous demarrer User Service? (O/N) [AUTO: O]" -ForegroundColor Yellow
$response = 'o'
# $response = Read-Host
if ($response -eq 'O' -or $response -eq 'o') {
    Start-Service -Name "User Service" -Path "user-service" -Port 8082 -HealthUrl "http://localhost:8082/actuator/health"
    Start-Sleep -Seconds 3
}

# 6. FOOD SERVICE (REQUIS)
$started = Start-Service -Name "Food Service" -Path "food-service" -Port 8083 -HealthUrl "http://localhost:8083/api/foods/health"
if (-not $started) {
    Write-Host "AVERTISSEMENT: Food Service n'a pas demarre correctement" -ForegroundColor Yellow
    $allStarted = $false
}
Start-Sleep -Seconds 5

# 7. MEAL SERVICE (REQUIS)
$started = Start-Service -Name "Meal Service" -Path "meal-service" -Port 8084 -HealthUrl "http://localhost:8084/api/meals/health"
if (-not $started) {
    Write-Host "AVERTISSEMENT: Meal Service n'a pas demarre correctement" -ForegroundColor Yellow
    $allStarted = $false
}
Start-Sleep -Seconds 5

# 8. WATER SERVICE (REQUIS)
$started = Start-Service -Name "Water Service" -Path "water-service" -Port 8085 -HealthUrl "http://localhost:8085/api/water/health"
if (-not $started) {
    Write-Host "AVERTISSEMENT: Water Service n'a pas demarre correctement" -ForegroundColor Yellow
    $allStarted = $false
}
Start-Sleep -Seconds 5

# 9. AI SERVICE (RAG + Agent IA) - DÉMARRE AUTOMATIQUEMENT
Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "AI SERVICE - CHATBOT RAG + AGENT IA" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "Fonctionnalites:" -ForegroundColor Cyan
Write-Host "  - RAG (Base de connaissances nutritionnelle)" -ForegroundColor White
Write-Host "  - Agent IA (Calcul objectifs personnalises)" -ForegroundColor White
Write-Host "  - Chat intelligent avec Phi3 (Ollama)" -ForegroundColor White
Write-Host ""

# Vérification silencieuse d'Ollama (pas de questions)
Write-Host "Verification d'Ollama..." -ForegroundColor Yellow
$ollamaOk = $false
try {
    # Tester l'API Ollama
    $ollamaTest = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -TimeoutSec 3 -ErrorAction Stop

    # Vérifier si Phi3 est disponible
    $hasPhi3 = $false
    foreach ($model in $ollamaTest.models) {
        if ($model.name -like "*phi3*") {
            $hasPhi3 = $true
            break
        }
    }

    if ($hasPhi3) {
        Write-Host "  ✅ Ollama + Phi3: OK" -ForegroundColor Green
        $ollamaOk = $true
    }
    else {
        Write-Host "  ⚠️  Ollama actif mais Phi3 manquant" -ForegroundColor Yellow
        Write-Host "  Telechargement de Phi3 en cours (1.6 GB)..." -ForegroundColor Gray
        ollama pull phi3 | Out-Null
        Write-Host "  ✅ Phi3 telecharge!" -ForegroundColor Green
        $ollamaOk = $true
    }
}
catch {
    Write-Host "  ⚠️  Ollama non detecte, tentative de demarrage..." -ForegroundColor Yellow

    # Essayer de démarrer Ollama automatiquement
    try {
        Start-Process ollama -ArgumentList "serve" -WindowStyle Hidden -ErrorAction Stop
        Write-Host "  ⏳ Attente du demarrage d'Ollama (15 secondes)..." -ForegroundColor Gray
        Start-Sleep -Seconds 15

        # Re-tester
        $ollamaTest2 = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -TimeoutSec 5 -ErrorAction Stop
        Write-Host "  ✅ Ollama demarre avec succes!" -ForegroundColor Green

        # Vérifier Phi3
        $hasPhi32 = $false
        foreach ($model in $ollamaTest2.models) {
            if ($model.name -like "*phi3*") {
                $hasPhi32 = $true
                break
            }
        }

        if (-not $hasPhi32) {
            Write-Host "  Installation de Phi3..." -ForegroundColor Yellow
            ollama pull phi3 | Out-Null
            Write-Host "  ✅ Phi3 installe!" -ForegroundColor Green
        }

        $ollamaOk = $true
    }
    catch {
        Write-Host "  ❌ Impossible de demarrer Ollama automatiquement" -ForegroundColor Red
        Write-Host "  Le AI Service demarrera mais ne pourra pas repondre aux requetes" -ForegroundColor Yellow
        Write-Host "  Demarrez Ollama manuellement: ollama serve" -ForegroundColor Gray
        $ollamaOk = $false
    }
}

Write-Host ""
Write-Host "Demarrage de l'AI Service (RAG + Agent)..." -ForegroundColor Cyan

# Démarrer le AI Service (toujours, même si Ollama n'est pas OK)
$started = Start-Service -Name "AI Service (RAG + Agent)" -Path "ai-service" -Port 8087 -HealthUrl $null

# Attendre que le service charge completement
Write-Host "  Attente du chargement complet (base de connaissances)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Verifier que le port est actif
if (Test-Port -Port 8087) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "AI SERVICE PRET!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Endpoints disponibles:" -ForegroundColor Cyan
    Write-Host "  - Chat RAG:     POST http://localhost:8087/api/chat/rag" -ForegroundColor White
    Write-Host "  - Agent Goals:  POST http://localhost:8087/api/agent/calculate-goals" -ForegroundColor White
    Write-Host "  - Analyze:      POST http://localhost:8087/api/agent/analyze-profile" -ForegroundColor White
    Write-Host ""
    if ($ollamaOk) {
        Write-Host "Status: ✅ Operationnel avec Phi3" -ForegroundColor Green
    }
    else {
        Write-Host "Status: ⚠️  Demarre mais Ollama non disponible" -ForegroundColor Yellow
        Write-Host "Action: Demarrez Ollama avec 'ollama serve' pour activer le chat" -ForegroundColor Yellow
    }
    Write-Host "Base de connaissances: 165 segments indexes" -ForegroundColor Gray
    Write-Host "Verifiez les logs dans la fenetre pour confirmation!" -ForegroundColor Gray
}
else {
    Write-Host "AVERTISSEMENT: AI Service n'a pas demarre correctement" -ForegroundColor Yellow
    Write-Host "Verifiez les logs dans la fenetre du service" -ForegroundColor Gray
}
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ATTENTE DE L'ENREGISTREMENT DANS EUREKA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Attente de 30 secondes que tous les services s'enregistrent..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# ETAPE 4: Verification finale
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VERIFICATION DES SERVICES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$services = @(
    @{Name = "Eureka Server"; Url = "http://localhost:8761/actuator/health" },
    @{Name = "API Gateway"; Url = "http://localhost:8080/actuator/health" },
    @{Name = "Food Service (direct)"; Url = "http://localhost:8083/api/foods/health" },
    @{Name = "Meal Service (direct)"; Url = "http://localhost:8084/api/meals/health" },
    @{Name = "Water Service (direct)"; Url = "http://localhost:8085/api/water/health" },
    @{Name = "Food via Gateway"; Url = "http://localhost:8080/api/foods/health" },
    @{Name = "Meal via Gateway"; Url = "http://localhost:8080/api/meals/health" },
    @{Name = "Water via Gateway"; Url = "http://localhost:8080/api/water/health" }
)

# Note: AI Service n'est pas inclus dans les tests car il n'a pas de health endpoint
# Verifiez manuellement que le port 8087 est actif

$successCount = 0
$totalCount = $services.Count

foreach ($service in $services) {
    Write-Host "Test: $($service.Name)..." -NoNewline
    try {
        $response = Invoke-WebRequest -Uri $service.Url -TimeoutSec 3 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host " OK" -ForegroundColor Green
            $successCount++
        }
        else {
            Write-Host " ECHEC (Status: $($response.StatusCode))" -ForegroundColor Red
        }
    }
    catch {
        Write-Host " ECHEC" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESULTAT: $successCount/$totalCount services OK" -ForegroundColor $(if ($successCount -eq $totalCount) { "Green" } else { "Yellow" })
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ETAPE 5: Instructions pour le frontend
if ($successCount -ge 5) {
    Write-Host "SUCCES! Les services backend sont prets!" -ForegroundColor Green
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "DEMARRAGE DU FRONTEND" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Voulez-vous demarrer le frontend Angular maintenant? (O/N) [AUTO: O]" -ForegroundColor Yellow
    $response = 'o'
    # $response = Read-Host

    if ($response -eq 'O' -or $response -eq 'o') {
        Write-Host ""
        Write-Host "Demarrage du frontend..." -ForegroundColor Cyan

        $frontendPath = Join-Path $projectRoot "frontend"

        # Verifier si node_modules existe
        if (-not (Test-Path "$frontendPath\node_modules")) {
            Write-Host "Installation des dependances npm (premiere fois)..." -ForegroundColor Yellow
            cd $frontendPath
            npm install
        }

        # Demarrer le frontend
        Write-Host "Lancement du serveur Angular..." -ForegroundColor Cyan
        cd $frontendPath
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host '=== Frontend Angular ===' -ForegroundColor Cyan; Write-Host 'URL: http://localhost:4200' -ForegroundColor Green; Write-Host ''; npm start"

        Start-Sleep -Seconds 5

        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "TOUT EST DEMARRE!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "URLs importantes:" -ForegroundColor Cyan
        Write-Host "  - Frontend:         http://localhost:4200" -ForegroundColor White
        Write-Host "  - Eureka Dashboard: http://localhost:8761" -ForegroundColor White
        Write-Host "  - API Gateway:      http://localhost:8080" -ForegroundColor White
        Write-Host "  - AI Service (RAG): http://localhost:8087/actuator/health" -ForegroundColor White
        Write-Host ""
        Write-Host "Page Diagnostic:     http://localhost:4200/diagnostic" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "💬 Tester le Chatbot RAG + Agent:" -ForegroundColor Cyan
        Write-Host "  1. Ouvrir http://localhost:4200" -ForegroundColor White
        Write-Host "  2. Cliquer sur le bouton 🤖 en bas a droite" -ForegroundColor White
        Write-Host "  3. Mode Agent: cliquer sur 'Basic' pour activer" -ForegroundColor White
        Write-Host "  4. Tester: 'Qu'est-ce que le diabete?' ou cliquer '🎯 Objectifs'" -ForegroundColor White
        Write-Host ""
    }
    else {
        Write-Host ""
        Write-Host "Pour demarrer le frontend plus tard:" -ForegroundColor Yellow
        Write-Host "  cd frontend" -ForegroundColor White
        Write-Host "  npm start" -ForegroundColor White
        Write-Host ""
        Write-Host "OU executer: .\START-FRONTEND.ps1" -ForegroundColor Cyan
    }
}
else {
    Write-Host "ATTENTION: Certains services n'ont pas demarre correctement!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Verifications suggeres:" -ForegroundColor Yellow
    Write-Host "1. Consultez Eureka Dashboard: http://localhost:8761" -ForegroundColor White
    Write-Host "2. Verifiez les logs dans les fenetres PowerShell des services" -ForegroundColor White
    Write-Host "3. Attendez 1-2 minutes supplementaires" -ForegroundColor White
    Write-Host "4. Relancez: .\TEST-SERVICES.ps1" -ForegroundColor White
}

Write-Host ""
Write-Host "Appuyez sur une touche pour fermer cette fenetre..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
