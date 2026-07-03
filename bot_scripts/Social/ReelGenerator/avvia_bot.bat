@echo off
echo =========================================
echo AVVIO BOT AUTOMATICO INSTAGRAM NEATX
echo =========================================
cd /d "%~dp0"
python auto_bot.py
echo.
echo Processo completato.
timeout /t 10
