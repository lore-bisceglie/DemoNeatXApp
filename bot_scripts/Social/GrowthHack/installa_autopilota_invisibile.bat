@echo off
color 0A
title Setup Autopilota Invisibile - Growth Hack

echo =======================================================
echo    NEATX GROWTH HACKING - INSTALLAZIONE AUTOPILOTA
echo =======================================================
echo.
echo Questo script configurera' il Commentatore Sniper per 
echo avviarsi in modo INVISIBILE in background ogni volta 
echo che accendi il computer. 
echo Nessuna finestra nera fastidiosa!
echo.
pause

:: 1. Crea file .env se non esiste
if not exist ".env" (
    echo Creazione file .env...
    echo INSTA_USER=iltuonomeutente> .env
    echo INSTA_PASS=latuapassword>> .env
    echo GEMINI_API_KEY=latuachiavegemini>> .env
    echo.
    echo [ATTENZIONE] Ho creato un file chiamato ".env" in questa cartella.
    echo Aprilo col Blocco Note e inserisci i tuoi veri dati di Instagram e Gemini prima di riavviare il PC!
    echo.
) else (
    echo File .env gia' presente.
)

:: 2. Installa la libreria dotenv se manca
echo Installazione requisiti...
pip install python-dotenv instagrapi google-generativeai

:: 3. Crea il file VBScript per l'avvio invisibile
echo Set WshShell = CreateObject("WScript.Shell") > avvio_invisibile_sniper.vbs
echo WshShell.Run "python """ ^& CreateObject("Scripting.FileSystemObject").GetAbsolutePathName("sniper_commenti.py") ^& """", 0, False >> avvio_invisibile_sniper.vbs

:: 4. Copia nella cartella di Esecuzione Automatica di Windows
echo.
echo Copio il motore nella cartella di Avvio di Windows...
copy avvio_invisibile_sniper.vbs "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\avvio_invisibile_sniper.vbs" /Y

echo.
echo =======================================================
echo                  INSTALLAZIONE COMPLETATA!
echo =======================================================
echo Da questo momento in poi, lo Sniper dei Commenti lavorera' 
echo 24 ore su 24, 7 giorni su 7, completamente in background 
echo ogni volta che accendi il PC.
echo.
echo Vuoi avviarlo subito (invisibilmente)?
set /p avvia="Premi S per avviare subito o N per aspettare il prossimo riavvio: "
if /I "%avvia%"=="S" (
    wscript.exe avvio_invisibile_sniper.vbs
    echo.
    echo Bot avviato. Sta girando come un'ombra nel sistema!
)

pause
exit
