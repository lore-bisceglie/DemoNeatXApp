@echo off
echo =========================================
echo AVVIO BOT AUTOMATICO REEL NEATX
echo Instagram + YouTube + TikTok se il PC e' acceso
echo =========================================
cd /d "%~dp0"
set TIKTOK_HEADLESS=false
set LOCAL_PC_RUN=true
python auto_bot.py
set BOT_EXIT=%ERRORLEVEL%
echo.
echo Processo completato.
if "%BOT_EXIT%"=="0" timeout /t 10 /nobreak >nul 2>nul
exit /b %BOT_EXIT%
