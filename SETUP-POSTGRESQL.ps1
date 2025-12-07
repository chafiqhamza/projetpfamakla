# Script d'installation et configuration PostgreSQL pour Makla
# Executer avec : .\SETUP-POSTGRESQL.ps1

Write-Host ""
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host "  CONFIGURATION POSTGRESQL POUR MAKLA" -ForegroundColor Cyan
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host ""

# Verifier si PostgreSQL est installe
Write-Host "Verification de PostgreSQL..." -ForegroundColor Cyan

$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue

if ($null -eq $pgService) {
    Write-Host "PostgreSQL n'est pas installe!" -ForegroundColor Red
    Write-Host ""
    Write-Host "OPTIONS:" -ForegroundColor Yellow
    Write-Host "  1. Telecharger depuis : https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host "  2. Ou utiliser Docker : docker run --name postgres-makla -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15" -ForegroundColor White
    Write-Host ""
    exit
}

Write-Host "PostgreSQL trouve: $($pgService.DisplayName)" -ForegroundColor Green

# Verifier si le service tourne
if ($pgService.Status -ne "Running") {
    Write-Host "PostgreSQL n'est pas demarre" -ForegroundColor Yellow
    Write-Host "Demarrage de PostgreSQL..." -ForegroundColor Yellow
    Start-Service $pgService.Name
    Start-Sleep -Seconds 3
    Write-Host "PostgreSQL demarre" -ForegroundColor Green
} else {
    Write-Host "PostgreSQL est actif" -ForegroundColor Green
}

Write-Host ""
Write-Host "Creation de la base de donnees..." -ForegroundColor Cyan

# Trouver psql.exe
$psqlPath = ""
$possiblePaths = @(
    "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files\PostgreSQL\15\bin\psql.exe",
    "C:\Program Files\PostgreSQL\14\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\15\bin\psql.exe"
)

foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $psqlPath = $path
        break
    }
}

if ($psqlPath -eq "") {
    Write-Host "psql.exe non trouve!" -ForegroundColor Red
    Write-Host "Creez la base manuellement via pgAdmin:" -ForegroundColor Yellow
    Write-Host "  1. Ouvrir pgAdmin" -ForegroundColor White
    Write-Host "  2. Clic droit sur Databases -> Create -> Database" -ForegroundColor White
    Write-Host "  3. Nom: makladb" -ForegroundColor White
    Write-Host ""
    exit
}

Write-Host "psql trouve: $psqlPath" -ForegroundColor Green

# Demander le mot de passe
Write-Host ""
Write-Host "Entrez le mot de passe PostgreSQL (utilisateur 'postgres'):" -ForegroundColor Yellow
$password = Read-Host -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Definir la variable d'environnement pour le mot de passe
$env:PGPASSWORD = $plainPassword

# Verifier si la base existe deja
Write-Host ""
Write-Host "Verification de l'existence de la base..." -ForegroundColor Cyan
$checkDb = & $psqlPath -U postgres -t -c "SELECT 1 FROM pg_database WHERE datname='makladb'" 2>$null

if ($checkDb -match "1") {
    Write-Host "La base de donnees 'makladb' existe deja" -ForegroundColor Green
} else {
    Write-Host "Creation de la base de donnees 'makladb'..." -ForegroundColor Yellow
    & $psqlPath -U postgres -c "CREATE DATABASE makladb;" 2>$null

    if ($LASTEXITCODE -eq 0) {
        Write-Host "Base de donnees 'makladb' creee avec succes!" -ForegroundColor Green
    } else {
        Write-Host "Erreur lors de la creation de la base" -ForegroundColor Red
        Write-Host "Verifiez le mot de passe et reessayez" -ForegroundColor Yellow
        exit
    }
}

# Lister les bases de donnees
Write-Host ""
Write-Host "Bases de donnees PostgreSQL:" -ForegroundColor Cyan
& $psqlPath -U postgres -c "\l" 2>$null | Select-String "makladb"

# Nettoyer la variable d'environnement
Remove-Item Env:\PGPASSWORD

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "POSTGRESQL CONFIGURE AVEC SUCCES !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "   - Base de donnees : makladb" -ForegroundColor White
Write-Host "   - Port            : 5432" -ForegroundColor White
Write-Host "   - Utilisateur     : postgres" -ForegroundColor White
Write-Host ""
Write-Host "PROCHAINES ETAPES:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Verifier application.properties de auth-service:" -ForegroundColor Cyan
Write-Host "   auth-service\src\main\resources\application.properties" -ForegroundColor Gray
Write-Host "   -> spring.datasource.url=jdbc:postgresql://localhost:5432/makladb" -ForegroundColor Gray
Write-Host "   -> spring.datasource.username=postgres" -ForegroundColor Gray
Write-Host "   -> spring.datasource.password=VOTRE_MOT_DE_PASSE" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Compiler l'auth-service:" -ForegroundColor Cyan
Write-Host "   .\mvnw.cmd clean package -DskipTests -pl auth-service -am" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Demarrer l'auth-service:" -ForegroundColor Cyan
Write-Host "   java -jar auth-service\target\auth-service-0.0.1-SNAPSHOT.jar" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Demarrer le frontend:" -ForegroundColor Cyan
Write-Host "   cd frontend" -ForegroundColor Gray
Write-Host "   ng serve" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Tester l'inscription:" -ForegroundColor Cyan
Write-Host "   http://localhost:4200/register" -ForegroundColor Gray
Write-Host ""
Write-Host "Documentation complete:" -ForegroundColor Yellow
Write-Host "   AUTH-POSTGRESQL-GUIDE-COMPLET.md" -ForegroundColor Gray
Write-Host ""
Write-Host "PostgreSQL est pret pour Makla !" -ForegroundColor Green
Write-Host ""

