@echo off
echo =========================================
echo AVVIO BOT AUTOMATICO REEL NEATX
echo Instagram + YouTube + TikTok se il PC e' acceso
echo =========================================
cd /d "%~dp0"
if not exist "logs" mkdir "logs"
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss"') do set RUN_TS=%%i
set LOG_FILE=logs\reel_bot_%RUN_TS%.log
set TIKTOK_HEADLESS=false
set LOCAL_PC_RUN=true
set STRICT_PUBLISH=true
echo Log esecuzione: %LOG_FILE%
echo Avvio bot in modalita severa: se Instagram, TikTok o YouTube falliscono, il task fallisce.
python auto_bot.py > "%LOG_FILE%" 2>&1
set BOT_EXIT=%ERRORLEVEL%
echo.
echo Processo completato con codice %BOT_EXIT%.
echo Log salvato in: %LOG_FILE%
if "%BOT_EXIT%"=="0" timeout /t 10 /nobreak >nul 2>nul
exit /b %BOT_EXIT%
