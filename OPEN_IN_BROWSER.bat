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
npx expo start --web
pause
