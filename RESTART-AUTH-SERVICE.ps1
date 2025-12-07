# Script pour redémarrer le service auth-service

Write-Host "Arrêt du service auth-service si déjà en cours d'exécution..." -ForegroundColor Yellow

# Trouver et arrêter le processus utilisant le port 8081
$process = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
if ($process) {
    Write-Host "Arrêt du processus $process sur le port 8081..." -ForegroundColor Yellow
    Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

Write-Host "Démarrage du service auth-service..." -ForegroundColor Green
cd C:\Users\PC\IdeaProjects\projetmakla\auth-service
java -jar target\auth-service-0.0.1-SNAPSHOT.jar

