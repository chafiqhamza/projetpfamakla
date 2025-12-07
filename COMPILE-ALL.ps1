# Script pour compiler tous les services
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "COMPILATION DES SERVICES MAKLA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = "C:\Users\PC\IdeaProjects\projetmakla"
cd $projectRoot

$services = @(
    "eureka-server",
    "config-server",
    "api-gateway",
    "auth-service",
    "user-service",
    "food-service",
    "meal-service",
    "water-service"
)

$compiled = 0
$failed = 0

foreach ($service in $services) {
    Write-Host "Compilation de $service..." -ForegroundColor Yellow
    cd "$projectRoot\$service"

    # Nettoyer le target
    Remove-Item -Path target -Recurse -Force -ErrorAction SilentlyContinue

    # Compiler
    $output = & ..\mvnw.cmd clean compile -DskipTests 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  $service compile!" -ForegroundColor Green
        $compiled++
    } else {
        Write-Host "  $service ECHEC!" -ForegroundColor Red
        $failed++
        Write-Host "  Erreur: $($output | Select-String 'ERROR' | Select-Object -First 3)" -ForegroundColor Red
    }
    Write-Host ""
}

cd $projectRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESULTAT DE LA COMPILATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Services compiles: $compiled/$($services.Count)" -ForegroundColor Green
Write-Host "Echecs: $failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($failed -eq 0) {
    Write-Host "Tous les services sont prêts a demarrer!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Pour demarrer les services:" -ForegroundColor Yellow
    Write-Host "  .\START-ALL-AUTO.ps1" -ForegroundColor Cyan
} else {
    Write-Host "Certains services n'ont pas compile." -ForegroundColor Red
    Write-Host "Veuillez corriger les erreurs avant de continuer." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Appuyez sur une touche pour fermer..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

