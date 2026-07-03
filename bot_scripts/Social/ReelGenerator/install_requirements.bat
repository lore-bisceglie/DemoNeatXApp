@echo off
echo ==================================================
echo Installazione Requisiti - Generatore Reels NeatX
echo ==================================================
echo.
echo Controllo installazione Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRORE] Python non e' installato o non e' nel PATH.
    echo Per favore installa Python dal Microsoft Store e riprova.
    pause
    exit /b
)

echo.
echo Installazione librerie in corso...
pip install moviepy==1.0.3 edge-tts pillow numpy

echo.
echo ==================================================
echo Installazione completata con successo!
echo Assicurati di aver inserito un video di sfondo in assets/background.mp4
echo Ora puoi avviare generate_reel.py
echo ==================================================
pause
