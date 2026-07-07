@echo off
title GigGround - Browser Preview
echo ==================================================
echo   Starting GigGround in your web browser...
echo   A browser tab will open showing the app as a phone.
echo   Keep THIS black window open while you use it.
echo   Close it when you're done.
echo ==================================================
echo.
cd /d "%~dp0"
if not exist "node_modules" (
  echo First time setup - installing app files, this can take a few minutes...
  call npm install
)
npx expo start --web
pause
