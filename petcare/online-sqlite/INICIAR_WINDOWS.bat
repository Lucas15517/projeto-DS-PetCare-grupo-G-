@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Instale o Node.js 22 ou superior em https://nodejs.org/
 pause
 exit /b 1
)
if not exist "data" mkdir "data"
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"
node server.js
pause
