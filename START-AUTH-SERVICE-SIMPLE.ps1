# Script simple pour démarrer UNIQUEMENT le service auth-service
# Utilisez ce script après avoir démarré Eureka Server

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  DÉMARRAGE AUTH-SERVICE (Port 8081)" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier si Eureka est disponible
Write-Host "1. Vérification d'Eureka Server..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8761" -Method GET -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
    Write-Host "   ✅ Eureka Server est en ligne" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Eureka Server n'est pas accessible" -ForegroundColor Red
    Write-Host "   💡 Démarrez Eureka d'abord ou continuez sans Eureka" -ForegroundColor Yellow
    Write-Host ""
}

# Vérifier si le port 8081 est libre
Write-Host "2. Vérification du port 8081..." -ForegroundColor Yellow
$port8081 = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue
if ($port8081) {
    Write-Host "   ⚠️  Le port 8081 est déjà utilisé" -ForegroundColor Red
    $process = Get-Process -Id $port8081.OwningProcess -ErrorAction SilentlyContinue
    if ($process) {
        Write-Host "   Processus : $($process.ProcessName) (PID: $($process.Id))" -ForegroundColor Gray
        Write-Host ""
        $response = Read-Host "   Voulez-vous arrêter ce processus ? (O/N)"
        if ($response -eq "O" -or $response -eq "o") {
            Stop-Process -Id $process.Id -Force
            Write-Host "   ✅ Processus arrêté" -ForegroundColor Green
            Start-Sleep -Seconds 2
        } else {
            Write-Host "   ❌ Impossible de démarrer sur le port 8081" -ForegroundColor Red
            exit 1
        }
    }
} else {
    Write-Host "   ✅ Le port 8081 est libre" -ForegroundColor Green
}

Write-Host ""
Write-Host "3. Démarrage du service auth-service..." -ForegroundColor Yellow
Write-Host ""

# Démarrer le service
cd C:\Users\PC\IdeaProjects\projetmakla\auth-service

Write-Host "   📦 Chargement du JAR..." -ForegroundColor Gray
Write-Host "   🚀 Démarrage de Spring Boot..." -ForegroundColor Gray
Write-Host ""
Write-Host "   ⏳ Veuillez patienter 10-15 secondes..." -ForegroundColor Cyan
Write-Host ""
Write-Host "   Les logs s'afficheront ci-dessous :" -ForegroundColor Gray
Write-Host "   " -NoNewline
Write-Host "─────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""

java -jar target\auth-service-0.0.1-SNAPSHOT.jar

