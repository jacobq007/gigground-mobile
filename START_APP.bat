@echo off
title GigGround Mobile - App Server
echo ============================================
echo   Starting the GigGround app...
echo   Keep this window OPEN while you use the app.
echo   Close it when you're done.
echo ============================================
echo.
cd /d "%~dp0"
if not exist "node_modules" (
  echo First time setup - installing app files, this can take a few minutes...
  call npm install
)
npx expo start --lan
pause
