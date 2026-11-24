@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Instale o Node.js 22.13 ou superior em https://nodejs.org/
 pause
 exit /b 1
)
node -e "const [major,minor]=process.versions.node.split('.').map(Number);if(major<22||(major===22&&minor<13))process.exit(1)"
if errorlevel 1 (
 echo Esta versao precisa do Node.js 22.13 ou superior.
 echo Node encontrado:
 node --version
 pause
 exit /b 1
)
set "PETCARE_STORAGE=sqlite"
set "PETCARE_DATA_DIR=%~dp0..\data"
if exist "%~dp0data\petcare.sqlite" set "PETCARE_DATA_DIR=%~dp0data"
if not exist "%PETCARE_DATA_DIR%" mkdir "%PETCARE_DATA_DIR%"
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"
node server.js
pause
