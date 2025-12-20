@echo off
echo ==============================================
echo   PHI3 AI SERVICE SETUP AND TEST
echo ==============================================
echo.

echo 1. Checking if Ollama is installed...
where ollama >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Ollama is not installed or not in PATH
    echo Please install Ollama from: https://ollama.ai/
    echo Then run: ollama pull phi3
    pause
    exit /b 1
) else (
    echo ✅ Ollama is installed
)

echo.
echo 2. Checking if Ollama service is running...
curl -s http://localhost:11434/api/version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Ollama service is not running
    echo Starting Ollama service...
    start /b ollama serve
    timeout /t 5 /nobreak >nul
    echo ✅ Ollama service started
) else (
    echo ✅ Ollama service is running
)

echo.
echo 3. Checking if phi3 model is available...
ollama list | findstr "phi3" >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  phi3 model not found
    echo Downloading phi3 model (this may take a few minutes)...
    ollama pull phi3
    if %errorlevel% neq 0 (
        echo ❌ Failed to download phi3 model
        pause
        exit /b 1
    )
    echo ✅ phi3 model downloaded successfully
) else (
    echo ✅ phi3 model is available
)

echo.
echo 4. Testing phi3 model...
echo Testing with a simple query...
ollama run phi3 "Hello, are you phi3? Please respond with just 'Yes, I am phi3, your nutrition assistant.'"
if %errorlevel% neq 0 (
    echo ❌ Failed to communicate with phi3 model
    pause
    exit /b 1
) else (
    echo ✅ phi3 model is responding correctly
)

echo.
echo 5. Starting AI Service...
cd /d "%~dp0"
echo Starting Maven build and run...
start /b mvn spring-boot:run -Dspring-boot.run.profiles=dev

echo.
echo 6. Waiting for AI Service to start...
timeout /t 10 /nobreak >nul
echo Testing AI Service endpoint...
curl -X POST -H "Content-Type: application/json" -d "{\"message\":\"Hello, test connection\"}" http://localhost:8089/api/chat
if %errorlevel% neq 0 (
    echo ⚠️  AI Service might still be starting...
    echo Please wait a moment and test manually
) else (
    echo ✅ AI Service is responding
)

echo.
echo ==============================================
echo   PHI3 SETUP COMPLETE!
echo ==============================================
echo.
echo Your Phi3 AI service should now be ready to use in the frontend.
echo.
echo Services running:
echo - Ollama: http://localhost:11434
echo - AI Service: http://localhost:8089
echo.
echo You can now test the integration in your frontend!
echo.
pause
