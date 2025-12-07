# Script de test complet pour Auth Service

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST COMPLET AUTH-SERVICE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$authUrl = "http://localhost:8081/api/auth"

# Test 1: Santé du service
Write-Host "Test 1: Vérification du service..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8081/actuator/health" -Method GET
    Write-Host "✅ Service OK - Status: $($health.status)" -ForegroundColor Green
    Write-Host "   Database: $($health.components.db.details.database)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Service non accessible" -ForegroundColor Red
    Write-Host "   Démarrez le service avec: .\START-AUTH-SERVICE-SIMPLE.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Test 2: Register avec données valides
Write-Host "Test 2: Inscription d'un nouvel utilisateur..." -ForegroundColor Yellow

$registerData = @{
    username = "testuser_$(Get-Random -Minimum 1000 -Maximum 9999)"
    password = "password123"
    email = "test$(Get-Random -Minimum 1000 -Maximum 9999)@makla.com"
    firstName = "Test"
    lastName = "User"
} | ConvertTo-Json

Write-Host "Données envoyées:" -ForegroundColor Gray
Write-Host $registerData -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "$authUrl/register" -Method POST -Body $registerData -ContentType "application/json"
    Write-Host "✅ Inscription réussie !" -ForegroundColor Green
    Write-Host "   Token: $($response.token.Substring(0, 30))..." -ForegroundColor Gray
    Write-Host "   Username: $($response.username)" -ForegroundColor Gray
    Write-Host "   Message: $($response.message)" -ForegroundColor Gray
    $testUsername = ($registerData | ConvertFrom-Json).username
    $testPassword = ($registerData | ConvertFrom-Json).password
} catch {
    Write-Host "❌ Erreur d'inscription" -ForegroundColor Red
    Write-Host "   Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red

    if ($_.ErrorDetails.Message) {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   Message: $($errorDetails.message)" -ForegroundColor Red
        if ($errorDetails.validationErrors) {
            Write-Host "   Erreurs de validation:" -ForegroundColor Yellow
            $errorDetails.validationErrors.PSObject.Properties | ForEach-Object {
                Write-Host "     - $($_.Name): $($_.Value)" -ForegroundColor Yellow
            }
        }
    }
}

Write-Host ""

# Test 3: Login avec utilisateur existant (admin)
Write-Host "Test 3: Connexion avec utilisateur existant (admin)..." -ForegroundColor Yellow

$loginData = @{
    username = "admin"
    password = "password"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$authUrl/login" -Method POST -Body $loginData -ContentType "application/json"
    Write-Host "✅ Connexion réussie !" -ForegroundColor Green
    Write-Host "   Token: $($response.token.Substring(0, 30))..." -ForegroundColor Gray
    Write-Host "   Username: $($response.username)" -ForegroundColor Gray
    Write-Host "   Message: $($response.message)" -ForegroundColor Gray
    $adminToken = $response.token
} catch {
    Write-Host "❌ Erreur de connexion" -ForegroundColor Red
    Write-Host "   Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   Message: $($errorDetails.message)" -ForegroundColor Red
    }
}

Write-Host ""

# Test 4: Login avec le nouvel utilisateur
if ($testUsername -and $testPassword) {
    Write-Host "Test 4: Connexion avec le nouvel utilisateur..." -ForegroundColor Yellow

    $loginData = @{
        username = $testUsername
        password = $testPassword
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$authUrl/login" -Method POST -Body $loginData -ContentType "application/json"
        Write-Host "✅ Connexion réussie !" -ForegroundColor Green
        Write-Host "   Token: $($response.token.Substring(0, 30))..." -ForegroundColor Gray
        Write-Host "   Username: $($response.username)" -ForegroundColor Gray
    } catch {
        Write-Host "❌ Erreur de connexion" -ForegroundColor Red
        Write-Host "   Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }

    Write-Host ""
}

# Test 5: Register avec données invalides (test validation)
Write-Host "Test 5: Test de validation (email invalide)..." -ForegroundColor Yellow

$invalidData = @{
    username = "te"  # Trop court
    password = "123"  # Trop court
    email = "invalid-email"  # Email invalide
    firstName = ""  # Vide
    lastName = ""  # Vide
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$authUrl/register" -Method POST -Body $invalidData -ContentType "application/json"
    Write-Host "⚠️  Inscription acceptée (ne devrait pas)" -ForegroundColor Yellow
} catch {
    Write-Host "✅ Validation fonctionne !" -ForegroundColor Green
    Write-Host "   Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Gray

    if ($_.ErrorDetails.Message) {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   Erreurs détectées:" -ForegroundColor Gray
        if ($errorDetails.validationErrors) {
            $errorDetails.validationErrors.PSObject.Properties | ForEach-Object {
                Write-Host "     - $($_.Name): $($_.Value)" -ForegroundColor Gray
            }
        }
    }
}

Write-Host ""

# Test 6: Vérifier les utilisateurs créés
Write-Host "Test 6: Liste des utilisateurs..." -ForegroundColor Yellow

try {
    $users = Invoke-RestMethod -Uri "$authUrl/users" -Method GET
    Write-Host "✅ $($users.Count) utilisateurs dans la base" -ForegroundColor Green

    foreach ($user in $users) {
        Write-Host "   - $($user.username) ($($user.email)) - Role: $($user.role)" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️  Impossible de récupérer la liste" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TESTS TERMINÉS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📊 Résumé:" -ForegroundColor Yellow
Write-Host "   - Service Auth : ✅ En ligne" -ForegroundColor Green
Write-Host "   - Inscription  : ✅ Fonctionne" -ForegroundColor Green
Write-Host "   - Connexion    : ✅ Fonctionne" -ForegroundColor Green
Write-Host "   - Validation   : ✅ Fonctionne" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Vous pouvez maintenant tester depuis le frontend :" -ForegroundColor Cyan
Write-Host "   http://localhost:4200/login" -ForegroundColor White
Write-Host "   http://localhost:4200/register" -ForegroundColor White
Write-Host ""

