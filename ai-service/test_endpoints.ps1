$base = "http://localhost:8089/api"

Write-Host "Testing Chat..."
try {
    $chatBody = @{ message = "Is an apple healthy?" } | ConvertTo-Json
    $chat = Invoke-RestMethod -Uri "$base/chat" -Method Post -Body $chatBody -ContentType "application/json"
    Write-Host "Chat Response: $($chat.response)" -ForegroundColor Green
}
catch {
    Write-Host "Chat Failed: $_" -ForegroundColor Red
}

Write-Host "`nTesting Recommendations..."
try {
    $recBody = @{ preferences = "High Protein" } | ConvertTo-Json
    $rec = Invoke-RestMethod -Uri "$base/recommend" -Method Post -Body $recBody -ContentType "application/json"
    Write-Host "Rec Response: $rec" -ForegroundColor Green
}
catch {
    Write-Host "Rec Failed: $_" -ForegroundColor Red
}

Write-Host "`nTesting Vision (should still work)..."
$imagePath = "..\frontend\node_modules\serve-index\public\icons\page_white_picture.png"
if (Test-Path $imagePath) {
    & curl.exe -X POST "$base/vision/predict-food" -F "image=@$imagePath"
}
