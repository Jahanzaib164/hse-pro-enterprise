@echo off
title HSE Pro Enterprise
color 0B

echo.
echo  ============================================
echo   HSE Pro Enterprise - Starting...
echo  ============================================
echo.

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  ERROR: Node.js is not installed!
    echo.
    echo  Please install Node.js from: https://nodejs.org
    echo  Download the LTS version ^(e.g. 20.x^)
    echo.
    echo  After installing, run this file again.
    echo.
    pause
    start https://nodejs.org
    exit /b 1
)

for /f "tokens=1 delims=v." %%i in ('node --version') do set MAJOR=%%i
echo  Node.js found:

:: Install launcher deps if needed
if not exist "launcher\node_modules" (
    echo  Installing dependencies ^(first time only - please wait^)...
    cd launcher
    npm install --prefer-offline
    cd ..
)

:: Launch
echo  Starting HSE Pro Enterprise...
echo  The app will open in your browser automatically.
echo  Login: admin@hse-pro.com / Password123!
echo.
echo  Press Ctrl+C to stop the application.
echo.

node launcher\index.js

pause
