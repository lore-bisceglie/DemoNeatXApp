@echo off
color 0A
title NeatX Lead Hunter (Cacciatore di Clienti B2B)
echo =========================================
echo       NEATX LEAD HUNTER - AVVIO
echo =========================================
echo.
echo Premi INVIO per avviare la ricerca su Google Maps.
pause >nul

echo.
echo Sto attivando il bot... (Non chiudere questa finestra)
python hunter.py

echo.
echo =========================================
echo CACCIA COMPLETATA!
echo Controlla il file 'leads_estratti.csv' in questa cartella.
echo =========================================
pause
