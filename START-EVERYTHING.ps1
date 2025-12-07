# Script de demarrage complet et intelligent de tous les services Makla
# Ce script gere toutes les erreurs et verifie que chaque service demarre correctement

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEMARRAGE COMPLET DU PROJET MAKLA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = "C:\Users\PC\IdeaProjects\projetmakla"
$ErrorActionPreference = "Continue"

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
            $response = Invoke-WebRequest -Uri $Url -TimeoutSec 2 -ErrorAction Stop -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Host "  Service pret! (tentative $i/$MaxAttempts)" -ForegroundColor Green
                return $true
            }
        } catch {
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
        [string]$HealthUrl
    )

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "Demarrage: $Name (Port $Port)" -ForegroundColor Yellow
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

    $command = "cd '$servicePath'; Write-Host '=== $Name ===' -ForegroundColor Cyan; Write-Host 'Port: $Port' -ForegroundColor White; Write-Host ''; ..\mvnw.cmd spring-boot:run"

    $process = Start-Process powershell -ArgumentList "-NoExit", "-Command", $command -PassThru

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
} catch {
    Write-Host "ERREUR: Java n'est pas installe ou pas dans le PATH!" -ForegroundColor Red
    Write-Host "Installez Java 17 depuis: https://adoptium.net/temurin/releases/?version=17" -ForegroundColor Yellow
    pause
    exit 1
}
Write-Host ""

# ETAPE 2: Nettoyer les anciens processus
Write-Host "Voulez-vous arreter tous les processus Java existants? (O/N)" -ForegroundColor Yellow
$response = Read-Host
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
Write-Host "Voulez-vous demarrer Config Server? (O/N)" -ForegroundColor Yellow
$response = Read-Host
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

# 4. AUTH SERVICE
Write-Host ""
Write-Host "Voulez-vous demarrer Auth Service? (O/N)" -ForegroundColor Yellow
$response = Read-Host
if ($response -eq 'O' -or $response -eq 'o') {
    Start-Service -Name "Auth Service" -Path "auth-service" -Port 8081 -HealthUrl "http://localhost:8081/actuator/health"
    Start-Sleep -Seconds 3
}

# 5. USER SERVICE
Write-Host ""
Write-Host "Voulez-vous demarrer User Service? (O/N)" -ForegroundColor Yellow
$response = Read-Host
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
    @{Name="Eureka Server"; Url="http://localhost:8761/actuator/health"},
    @{Name="API Gateway"; Url="http://localhost:8080/actuator/health"},
    @{Name="Food Service (direct)"; Url="http://localhost:8083/api/foods/health"},
    @{Name="Meal Service (direct)"; Url="http://localhost:8084/api/meals/health"},
    @{Name="Water Service (direct)"; Url="http://localhost:8085/api/water/health"},
    @{Name="Food via Gateway"; Url="http://localhost:8080/api/foods/health"},
    @{Name="Meal via Gateway"; Url="http://localhost:8080/api/meals/health"},
    @{Name="Water via Gateway"; Url="http://localhost:8080/api/water/health"}
)

$successCount = 0
$totalCount = $services.Count

foreach ($service in $services) {
    Write-Host "Test: $($service.Name)..." -NoNewline
    try {
        $response = Invoke-WebRequest -Uri $service.Url -TimeoutSec 3 -ErrorAction Stop -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host " OK" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host " ECHEC (Status: $($response.StatusCode))" -ForegroundColor Red
        }
    } catch {
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
    Write-Host "Voulez-vous demarrer le frontend Angular maintenant? (O/N)" -ForegroundColor Yellow
    $response = Read-Host

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
        Write-Host "  - Frontend:        http://localhost:4200" -ForegroundColor White
        Write-Host "  - Eureka Dashboard: http://localhost:8761" -ForegroundColor White
        Write-Host "  - API Gateway:      http://localhost:8080" -ForegroundColor White
        Write-Host ""
        Write-Host "Page Diagnostic:    http://localhost:4200/diagnostic" -ForegroundColor Yellow
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "Pour demarrer le frontend plus tard:" -ForegroundColor Yellow
        Write-Host "  cd frontend" -ForegroundColor White
        Write-Host "  npm start" -ForegroundColor White
        Write-Host ""
        Write-Host "OU executer: .\START-FRONTEND.ps1" -ForegroundColor Cyan
    }
} else {
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

