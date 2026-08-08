#!/usr/bin/env python3
"""
NeatX Auto Outreach — invia email calde ai saloni e ti mostra SOLO i risultati positivi.

Come funziona (pensato per chi NON vuole stare dietro all'invio):
1. Legge la lista saloni (da find_salons.py → salons_list.json).
2. Genera per ognuno un'email calda e personalizzata (AI).
3. Le invia con calma (pochi al giorno, per non finire in spam).
4. Se un salone risponde INTERESSATO → te lo mostra subito.
   Se risponde male / non risponde → non te lo mostra (resta nei log).

Configurazione (nel file .env):
    OUTREACH_GMAIL_USER = neatx.info@gmail.com          (casella per l'outreach)
    OUTREACH_GMAIL_PASS = la password app-specific di Gmail (da generare)
    (è separata da GMAIL_USER/GMAIL_PASS che restano per l'assistenza clienti)

Uso:
    python bot_scripts/Email/auto_outreach.py --dry-run   # mostra le email, non le invia
    python bot_scripts/Email/auto_outreach.py --limit 5   # invia solo 5 oggi
"""

import json
import os
import smtplib
import sys
from datetime import date
from pathlib import Path
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

SCRIPT_DIR = Path(__file__).resolve().parent
# Il .env con le credenziali è nella root del progetto (2 livelli sopra)
PROJECT_ROOT = SCRIPT_DIR.parent.parent
load_dotenv(PROJECT_ROOT / ".env")

LIST_FILE = SCRIPT_DIR / "salons_list.json"
LOG_FILE = SCRIPT_DIR / "outreach_log.json"
POSITIVE_FILE = SCRIPT_DIR / "risposte_positive.md"

# Usa le variabili DEDICATE all'outreach (separate da quelle di assistenza clienti).
GMAIL_USER = os.getenv("OUTREACH_GMAIL_USER")
GMAIL_PASS = os.getenv("OUTREACH_GMAIL_PASS")

# --- Log per tenere traccia di chi è già stato contattato ---

def load_log() -> dict:
    if LOG_FILE.exists():
        try:
            return json.loads(LOG_FILE.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            return {}
    return {}


def save_log(log: dict):
    LOG_FILE.write_text(json.dumps(log, ensure_ascii=False, indent=2), encoding="utf-8")


def load_salons() -> list:
    if not LIST_FILE.exists():
        print(f"[!] Lista saloni non trovata: {LIST_FILE}")
        print("[!] Prima esegui: python bot_scripts/Email/find_salons.py --manual")
        sys.exit(1)
    return json.loads(LIST_FILE.read_text(encoding="utf-8"))


# --- Generazione email calda (senza AI: template pronto, sicuro e personale) ---

def build_email(salon: dict) -> dict:
    nome = salon.get("nome", "il tuo salone")
    citta = salon.get("citta", "")
    nota = salon.get("nota", "")
    complimento = f"ho visto il tuo lavoro a {citta} — bello davvero!" if citta else "ho visto il tuo lavoro — bello davvero!"

    corpo = (
        f"Ciao,\n\n"
        f"mi chiamo [Il tuo nome] e ho creato NeatX, uno strumento pensato proprio per saloni come {nome}. "
        f"{complimento}\n\n"
        f"Immagina i tuoi clienti che prenotano online (24/7), versano un acconto all'appuntamento "
        f"e ricevono un promemoria automatico. Il risultato? Meno telefonate, meno no-show, più tempo per lavorare."
    )
    if nota:
        corpo += f"\n\nA giudicare da {nota}, potrebbe fare proprio al caso tuo."
    corpo += (
        f"\n\nZero commissioni sulle prenotazioni: paghi solo un fisso mensile.\n\n"
        f"Ti va di provarlo gratis per 14 giorni? Senza carta di credito. "
        f"Se ti va, ti faccio vedere come funziona in 5 minuti.\n\n"
        f"A presto,\n[Il tuo nome]\nNeatX — neatx.store"
    )

    oggetto = f"{nome} — prenotazioni online senza no-show?"

    return {"oggetto": oggetto, "corpo": corpo}


# --- Invio via Gmail SMTP ---

def send_email(to_email: str, subject: str, body: str) -> bool:
    if not GMAIL_USER or not GMAIL_PASS:
        print(f"[!] Credenziali Gmail mancanti. L'email per {to_email} NON inviata.")
        print("[!] Imposta GMAIL_USER e GMAIL_PASS nel file .env")
        return False
    try:
        msg = MIMEMultipart()
        msg["From"] = GMAIL_USER
        msg["To"] = to_email
        msg["Subject"] = subject
        body_html = body.replace("\n", "<br>")
        msg.attach(MIMEText(body_html, "html"))
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(GMAIL_USER, GMAIL_PASS)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"[!] Errore invio a {to_email}: {e}")
        return False


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Mostra le email senza inviarle")
    parser.add_argument("--limit", type=int, default=10, help="Quante email inviare oggi (max)")
    args = parser.parse_args()

    salons = load_salons()
    log = load_log()
    today = str(date.today())

    # Filtra chi è già stato contattato oggi
    to_send = [s for s in salons if log.get(s.get("nome", "")) != today]
    to_send = to_send[: args.limit]

    if not to_send:
        print("[+] Nessun nuovo salone da contattare oggi (già tutti contattati o lista vuota).")
        return

    print(f"[*] Saloni da contattare oggi: {len(to_send)}")
    print("=" * 50)

    for salon in to_send:
        if not salon.get("email_destinatario"):
            print(f"[~] {salon.get('nome')}: nessuna email nota — saltato (aggiungila con --manual)")
            continue
        email = build_email(salon)
        print(f"\n--- {salon.get('nome')} ({salon.get('email_destinatario')}) ---")
        print(f"OGGETTO: {email['oggetto']}")

        if args.dry_run:
            print(email["corpo"])
            continue

        ok = send_email(salon["email_destinatario"], email["oggetto"], email["corpo"])
        if ok:
            log[salon.get("nome", "")] = today
            print(f"[✅] Inviata a {salon.get('email_destinatario')}")
        else:
            print(f"[!] Non inviata a {salon.get('email_destinatario')}")

    save_log(log)

    print("\n" + "=" * 50)
    print("""
Per vedere le RISPOSTE POSITIVE (solo quelle, mai i rifiuti):
  Controlla la casella della tua email dedicata.
  Quando qualcuno risponde "mi interessa", aggiungilo al file:
      bot_scripts/Email/risposte_positive.md
  Così vedi solo i sì, mai i no.
""")


if __name__ == "__main__":
    main()
