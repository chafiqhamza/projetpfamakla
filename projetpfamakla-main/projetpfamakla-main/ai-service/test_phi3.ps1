Write-Host "Testing phi3 AI Model..." -ForegroundColor Cyan
Write-Host ""

$base = "http://localhost:8089/api"

# Test 1: Simple Chat
Write-Host "Test 1: Simple Chat" -ForegroundColor Yellow
$chatBody = @{ message = "Hello, are you phi3?" } | ConvertTo-Json
try {
    $chat = Invoke-RestMethod -Uri "$base/chat" -Method Post -Body $chatBody -ContentType "application/json"
    Write-Host "Response: $($chat.response)" -ForegroundColor Green
}
catch {
    Write-Host "Chat Failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Test 2: Smart Chat with Intent Detection" -ForegroundColor Yellow
$smartBody = @{ message = "I ate a salad for lunch" } | ConvertTo-Json
try {
    $smart = Invoke-RestMethod -Uri "$base/smart/chat" -Method Post -Body $smartBody -ContentType "application/json"
    Write-Host "Intent: $($smart.intent)" -ForegroundColor Cyan
    Write-Host "Response: $($smart.response)" -ForegroundColor Green
    if ($smart.actionData) {
        Write-Host "Action Data: $($smart.actionData | ConvertTo-Json)" -ForegroundColor Magenta
    }
}
catch {
    Write-Host "Smart Chat Failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Test 3: Water Logging Detection" -ForegroundColor Yellow
$waterBody = @{ message = "I drank 3 glasses of water" } | ConvertTo-Json
try {
    $water = Invoke-RestMethod -Uri "$base/smart/chat" -Method Post -Body $waterBody -ContentType "application/json"
    Write-Host "Intent: $($water.intent)" -ForegroundColor Cyan
    Write-Host "Response: $($water.response)" -ForegroundColor Green
    if ($water.actionData) {
        Write-Host "Action Data: $($water.actionData | ConvertTo-Json)" -ForegroundColor Magenta
    }
}
catch {
    Write-Host "Water Test Failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Test 4: Report Request" -ForegroundColor Yellow
$reportBody = @{ message = "Show me my nutrition report" } | ConvertTo-Json
try {
    $report = Invoke-RestMethod -Uri "$base/smart/chat" -Method Post -Body $reportBody -ContentType "application/json"
    Write-Host "Intent: $($report.intent)" -ForegroundColor Cyan
    Write-Host "Response: $($report.response)" -ForegroundColor Green
}
catch {
    Write-Host "Report Test Failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "All tests completed!" -ForegroundColor Green
