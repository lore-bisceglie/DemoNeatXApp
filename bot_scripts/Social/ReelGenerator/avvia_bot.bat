@echo off
echo =========================================
echo AVVIO BOT AUTOMATICO INSTAGRAM NEATX
echo =========================================
cd /d "%~dp0"
python auto_bot.py
set BOT_EXIT=%ERRORLEVEL%
echo.
echo Processo completato.
if "%BOT_EXIT%"=="0" timeout /t 10 /nobreak >nul 2>nul
exit /b %BOT_EXIT%
