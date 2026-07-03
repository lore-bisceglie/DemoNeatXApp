@echo off
color 0B
title NeatX - Macchina da Crescita Social (Growth Hacking)

echo =======================================================
echo    NEATX GROWTH HACKING STUDIO - MODALITA' PILOTA
echo =======================================================
echo.
echo Seleziona quale macchina di crescita vuoi avviare:
echo.
echo 1. 👁️ SPIA VIRALE (Trova i video dei top creator e analizza l'algoritmo)
echo 2. 🎯 SNIPER COMMENTI (Commenta automaticamente usando l'Intelligenza Artificiale)
echo 3. Esci
echo.

set /p scelta="Scelta (1/2/3): "

if "%scelta%"=="1" goto spia
if "%scelta%"=="2" goto sniper
if "%scelta%"=="3" goto fine

:spia
echo.
echo Avvio Spia Virale...
python spia_virale.py
pause
goto fine

:sniper
echo.
echo Avvio Sniper Commenti...
echo Ricorda: Lo Sniper necessita della chiave API di Gemini per funzionare bene!
python sniper_commenti.py
pause
goto fine

:fine
exit
