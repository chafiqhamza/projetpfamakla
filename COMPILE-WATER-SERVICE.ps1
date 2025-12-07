# Script de compilation du water-service

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "COMPILATION DU WATER-SERVICE" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$projectRoot = "C:\Users\PC\IdeaProjects\projetmakla"
Set-Location $projectRoot

Write-Host "Nettoyage et compilation..." -ForegroundColor Yellow

# Lancer la compilation
$process = Start-Process -FilePath ".\mvnw.cmd" -ArgumentList "clean", "package", "-DskipTests", "-pl", "water-service", "-am" -NoNewWindow -Wait -PassThru

if ($process.ExitCode -eq 0) {
    Write-Host "`n✅ COMPILATION REUSSIE!" -ForegroundColor Green
    Write-Host "`nFichier JAR créé:" -ForegroundColor Yellow
    if (Test-Path "water-service\target\water-service-0.0.1-SNAPSHOT.jar") {
        $jarFile = Get-Item "water-service\target\water-service-0.0.1-SNAPSHOT.jar"
        Write-Host "  $($jarFile.FullName)" -ForegroundColor Cyan
        Write-Host "  Taille: $([math]::Round($jarFile.Length/1MB,2)) MB" -ForegroundColor Cyan
    }
} else {
    Write-Host "`n❌ ERREUR DE COMPILATION!" -ForegroundColor Red
    Write-Host "Code de sortie: $($process.ExitCode)" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan

