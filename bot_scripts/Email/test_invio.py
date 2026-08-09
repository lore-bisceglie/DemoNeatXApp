#!/usr/bin/env python3
"""Test di invio email da OUTREACH_GMAIL_USER verso un indirizzo di prova."""
import os, smtplib, sys
from pathlib import Path
from email.mime.text import MIMEText
from email.header import Header
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")

USER = os.getenv("OUTREACH_GMAIL_USER")
PASS = os.getenv("OUTREACH_GMAIL_PASS")
DEST = sys.argv[1] if len(sys.argv) > 1 else None

if not USER or not PASS:
    print("[!] OUTREACH_GMAIL_USER o OUTREACH_GMAIL_PASS mancanti")
    sys.exit(1)
if not DEST:
    print("[!] Usa: python test_invio.py 'destinatario@email.com'")
    sys.exit(1)

try:
    msg = MIMEText("Questa è una email di TEST da NeatX. Se la vedi, l'invio funziona! 🎉", _subtype="plain", _charset="utf-8")
    msg["From"] = USER
    msg["To"] = DEST
    msg["Subject"] = Header("[TEST] NeatX - verifica invio email", "utf-8")
    server = smtplib.SMTP("smtp.gmail.com", 587)
    server.starttls()
    server.login(USER, PASS)
    server.send_message(msg)
    server.quit()
    print(f"[OK] Email di TEST inviata da {USER} a {DEST}")
except Exception as e:
    print(f"[!] Errore: {e}")
    sys.exit(1)
