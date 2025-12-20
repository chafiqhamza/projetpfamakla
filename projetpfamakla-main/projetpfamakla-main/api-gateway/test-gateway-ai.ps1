Write-Host "=== TEST API GATEWAY -> AI SERVICE ===" -ForegroundColor Cyan

# Test endpoints via gateway (port 8081)
$gatewayBase = 'http://localhost:8081'
$aiDirectBase = 'http://localhost:8087'

function Test-Post ($url, $body) {
    Write-Host "\nTesting POST $url" -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri $url -Method POST -ContentType 'application/json' -Body ($body | ConvertTo-Json) -TimeoutSec 30
        Write-Host "  OK - Received response (type: $($response.GetType().Name))" -ForegroundColor Green
        return $response
    } catch {
        Write-Host "  ERROR - $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# 1) Test /api/chat/rag via gateway
$body1 = @{ message = 'Bonjour depuis gateway' }
Test-Post "$gatewayBase/api/chat/rag" $body1

# 2) Test /api/agent/analyze-profile via gateway
$profile = @{ age = 30; weight = 70; height = 175; gender = 'male'; activityLevel = 'moderate' }
Test-Post "$gatewayBase/api/agent/analyze-profile" $profile

# 3) Optional: test direct AI service (bypass gateway) to compare
Write-Host "\n-- Optional: direct AI service tests (http://localhost:8087) --" -ForegroundColor Cyan
Test-Post "$aiDirectBase/api/chat/rag" $body1
Test-Post "$aiDirectBase/api/agent/analyze-profile" $profile

Write-Host "\n=== TESTS TERMINES ===" -ForegroundColor Cyan
Write-Host "Note: si vous obtenez des erreurs 404 ou connexion refusée, vérifiez que :" -ForegroundColor Yellow
Write-Host " - Le service AI est démarré et écoute sur le port 8087" -ForegroundColor Yellow
Write-Host " - L'api-gateway est démarré (port 8081) et a bien relu sa config" -ForegroundColor Yellow
Write-Host " - Première requête au AI service peut prendre 30-90s (chargement du modèle)" -ForegroundColor Yellow
