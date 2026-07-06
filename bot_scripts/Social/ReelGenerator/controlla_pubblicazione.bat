@echo off
echo =========================================
echo CONTROLLO PUBBLICAZIONE REEL NEATX
echo Nessun video verra pubblicato.
echo =========================================
cd /d "%~dp0"
set STRICT_PUBLISH=true
python publish_reel.py --preflight
set CHECK_EXIT=%ERRORLEVEL%
echo.
if "%CHECK_EXIT%"=="0" (
  echo OK: YouTube, Instagram e TikTok sono pronti.
) else (
  echo ATTENZIONE: manca qualcosa. Apri publish_report.json per il dettaglio.
)
exit /b %CHECK_EXIT%
