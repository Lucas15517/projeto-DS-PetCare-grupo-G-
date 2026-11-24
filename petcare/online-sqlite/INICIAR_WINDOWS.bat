@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Instale o Node.js 22.5 ou superior em https://nodejs.org/
 pause
 exit /b 1
)
set "PETCARE_STORAGE=sqlite"
set "PETCARE_DATA_DIR=%~dp0..\data"
if not exist "%PETCARE_DATA_DIR%" mkdir "%PETCARE_DATA_DIR%"
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"
node server.js
pause
