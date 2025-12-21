@echo off
chcp 65001 >nul
echo ====================================
echo   MENU DE GESTION MAKLA
echo ====================================
echo.
echo 1. Demarrer TOUT (Backend + Frontend) [RECOMMANDE]
echo 2. Demarrer seulement le backend
echo 3. Demarrer seulement le frontend
echo 4. Tester les services
echo 5. Arreter tous les services
echo 6. Voir le README des scripts
echo 7. Quitter
echo.
choice /c 123456789 /n /m "Choisissez une option (1-9): "

if errorlevel 9 goto :end
if errorlevel 8 goto :readme
if errorlevel 7 goto :intellij_guide
if errorlevel 6 goto :stop
if errorlevel 5 goto :test
if errorlevel 4 goto :frontend
if errorlevel 3 goto :backend
if errorlevel 2 goto :everything
if errorlevel 1 goto :intellij

:intellij
powershell -ExecutionPolicy Bypass -File "%~dp0START-WITH-INTELLIJ.ps1"
goto :menu

:everything
powershell -ExecutionPolicy Bypass -File "%~dp0START-EVERYTHING.ps1"
goto :menu

:backend
powershell -ExecutionPolicy Bypass -File "%~dp0START-ALL-AUTO.ps1"
goto :menu

:frontend
powershell -ExecutionPolicy Bypass -File "%~dp0START-FRONTEND.ps1"
goto :menu

:test
powershell -ExecutionPolicy Bypass -File "%~dp0TEST-SERVICES.ps1"
pause
goto :menu

:stop
powershell -ExecutionPolicy Bypass -File "%~dp0STOP-ALL-SERVICES.ps1"
goto :menu

:intellij_guide
start GUIDE-INTELLIJ.md
goto :menu

:readme
start SCRIPTS-README.md
goto :menu

:menu
cls
goto :eof

:end
echo Au revoir!
exit /b 0

