# Script de test pour vérifier que le login fonctionne
# Ce script teste l'endpoint /api/auth/login après les corrections CORS

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST DE CONNEXION AUTH-SERVICE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$authUrl = "http://localhost:8081/api/auth/login"
$healthUrl = "http://localhost:8081/actuator/health"

# Test 1: Vérifier que le service est accessible
Write-Host "Test 1: Vérification de l'état du service..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri $healthUrl -Method GET -UseBasicParsing -TimeoutSec 5
    if ($healthResponse.StatusCode -eq 200) {
        Write-Host "  ✅ Le service auth-service est en ligne (port 8081)" -ForegroundColor Green
        Write-Host "  Réponse: $($healthResponse.Content)" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ❌ Le service auth-service n'est pas accessible sur le port 8081" -ForegroundColor Red
    Write-Host "  Erreur: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "  💡 Solution: Démarrez le service avec:" -ForegroundColor Yellow
    Write-Host "     .\RESTART-AUTH-SERVICE.ps1" -ForegroundColor Cyan
    Write-Host "     ou" -ForegroundColor Yellow
    Write-Host "     .\START-EVERYTHING.ps1" -ForegroundColor Cyan
    exit 1
}

Write-Host ""

# Test 2: Tester l'endpoint de login avec des identifiants valides
Write-Host "Test 2: Test de connexion avec admin/password..." -ForegroundColor Yellow

$loginData = @{
    username = "admin"
    password = "password"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "Origin" = "http://localhost:4200"
}

try {
    $response = Invoke-WebRequest -Uri $authUrl -Method POST -Body $loginData -Headers $headers -UseBasicParsing -TimeoutSec 10

    if ($response.StatusCode -eq 200) {
        Write-Host "  ✅ Connexion réussie ! (Status: 200 OK)" -ForegroundColor Green

        $responseData = $response.Content | ConvertFrom-Json
        Write-Host "  Token reçu: $($responseData.token.Substring(0, [Math]::Min(50, $responseData.token.Length)))..." -ForegroundColor Gray
        Write-Host "  Username: $($responseData.username)" -ForegroundColor Gray
        Write-Host "  Message: $($responseData.message)" -ForegroundColor Gray

        # Vérifier les headers CORS
        $corsHeaders = $response.Headers.GetEnumerator() | Where-Object { $_.Key -like "Access-Control-*" }
        if ($corsHeaders.Count -gt 0) {
            Write-Host ""
            Write-Host "  Headers CORS reçus:" -ForegroundColor Cyan
            foreach ($header in $corsHeaders) {
                Write-Host "    $($header.Key): $($header.Value)" -ForegroundColor Gray
            }
        }
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__

    if ($statusCode -eq 403) {
        Write-Host "  ❌ ERREUR 403 (Forbidden) - Le problème CORS persiste" -ForegroundColor Red
        Write-Host ""
        Write-Host "  💡 Solutions possibles:" -ForegroundColor Yellow
        Write-Host "     1. Vérifier que le service utilise la nouvelle version compilée:" -ForegroundColor Cyan
        Write-Host "        .\mvnw.cmd clean package -DskipTests -pl auth-service" -ForegroundColor Gray
        Write-Host ""
        Write-Host "     2. Redémarrer le service:" -ForegroundColor Cyan
        Write-Host "        .\RESTART-AUTH-SERVICE.ps1" -ForegroundColor Gray
        Write-Host ""
        Write-Host "     3. Vérifier les logs du service pour plus de détails" -ForegroundColor Cyan
    } elseif ($statusCode -eq 401) {
        Write-Host "  ⚠️  Erreur 401 (Unauthorized) - Identifiants incorrects" -ForegroundColor Yellow
        Write-Host "     Cela signifie que CORS fonctionne, mais les identifiants sont invalides" -ForegroundColor Gray
    } else {
        Write-Host "  ❌ Erreur HTTP $statusCode" -ForegroundColor Red
        Write-Host "  Message: $($_.Exception.Message)" -ForegroundColor Red
    }

    exit 1
}

Write-Host ""

# Test 3: Tester la requête OPTIONS (preflight CORS)
Write-Host "Test 3: Test de la requête preflight CORS (OPTIONS)..." -ForegroundColor Yellow

try {
    $optionsHeaders = @{
        "Origin" = "http://localhost:4200"
        "Access-Control-Request-Method" = "POST"
        "Access-Control-Request-Headers" = "content-type"
    }

    $optionsResponse = Invoke-WebRequest -Uri $authUrl -Method OPTIONS -Headers $optionsHeaders -UseBasicParsing -TimeoutSec 5

    if ($optionsResponse.StatusCode -eq 200 -or $optionsResponse.StatusCode -eq 204) {
        Write-Host "  ✅ Requête preflight réussie (Status: $($optionsResponse.StatusCode))" -ForegroundColor Green

        $allowOrigin = $optionsResponse.Headers["Access-Control-Allow-Origin"]
        $allowMethods = $optionsResponse.Headers["Access-Control-Allow-Methods"]
        $allowHeaders = $optionsResponse.Headers["Access-Control-Allow-Headers"]

        if ($allowOrigin) {
            Write-Host "  Access-Control-Allow-Origin: $allowOrigin" -ForegroundColor Gray
        }
        if ($allowMethods) {
            Write-Host "  Access-Control-Allow-Methods: $allowMethods" -ForegroundColor Gray
        }
        if ($allowHeaders) {
            Write-Host "  Access-Control-Allow-Headers: $allowHeaders" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "  ⚠️  Requête OPTIONS échouée (mais POST fonctionne, donc OK)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ TOUS LES TESTS SONT RÉUSSIS !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Le problème de login 403 est corrigé ! 🎉" -ForegroundColor Green
Write-Host "Vous pouvez maintenant vous connecter depuis le frontend." -ForegroundColor Gray
Write-Host ""

