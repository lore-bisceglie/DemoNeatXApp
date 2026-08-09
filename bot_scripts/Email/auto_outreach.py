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

import html
import json
import os
import smtplib
import sys
from datetime import date
from pathlib import Path
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import Header
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

# Brand NeatX (ripreso esattamente dal sito: Navbar/Footer e palette di globals.css)
BRAND_CYAN = "#00b4ff"      # X e CTA del sito
BRAND_NAVY = "#0b1221"      # pannelli/colonna
BRAND_DARK = "#050814"      # sfondo pagina email
BRAND_BORDER = "#1e2b4a"    # bordi sottili
TEXT_LIGHT = "#f1f5f9"      # testo principale su navy
TEXT_MUTED = "#94a3b8"      # testo secondario
BRAND_URL = "https://neatx.store"


def _a(text: str) -> str:
    """HTML-escape sicuro (apici compresi) per ogni dato che viene dal salone."""
    return html.escape(text, quote=True)


def _wordmark_html() -> str:
    """Wordmark NeatX esattamente come in Navbar: 'Neat' bianco + 'X' ciano."""
    return ('<span style="font-family:Arial,Helvetica,sans-serif;'
            'font-weight:bold;font-size:30px;line-height:1;'
            'color:#ffffff;letter-spacing:-0.5px;">Neat</span>'
            '<span style="font-family:Arial,Helvetica,sans-serif;'
            'font-weight:bold;font-size:30px;line-height:1;'
            f'color:{BRAND_CYAN};">X</span>')


def build_email(salon: dict) -> dict:
    nome = salon.get("nome", "il tuo salone")
    nota = salon.get("nota", "")

    # --- Versione testo puro (per client vecchi e per il punteggio spam) ---
    testo = (
        f"Ciao,\n\n"
        f"ti scrivo da NeatX, il software di prenotazioni online per chi lavora su appuntamento "
        f"— come {nome}.\n\n"
        f"NeatX non è nato a tavolino: è nato dai problemi veri di chi sta dietro la poltrona "
        f"o alla cassa di un salone. Il telefono che squilla mentre hai le mani occupate, "
        f"la cliente che prenota e poi non si presenta, l'agenda piena di buchi.\n\n"
        f"Immagina i tuoi clienti che prenotano online (24/7), versano un acconto all'appuntamento "
        f"e ricevono un promemoria automatico. Il risultato? Meno telefonate, meno clienti che non "
        f"si presentano, più tempo per lavorare."
    )
    if nota:
        testo += f"\n\nA giudicare da {nota}, potrebbe fare proprio al caso tuo."
    testo += (
        f"\n\nZero commissioni sulle prenotazioni: paghi solo un fisso mensile.\n\n"
        f"Ti va di provarlo gratis per 14 giorni? Senza carta di credito. "
        f"Se ti va, ti faccio vedere come funziona in 5 minuti.\n\n"
        f"A presto,\nLorenzo Bisceglie\nNeatX — {BRAND_URL}\n"
        f"\nQuesto è un messaggio commerciale da {BRAND_URL}. Puoi disiscriverti in qualsiasi momento."
    )

    # --- HTML professionale (inline styles, single column, email-safe) ---
    if nota:
        nota_para = f"""
            <p style="margin:0 0 20px 0;font-family:Arial,Helvetica,sans-serif;
                      font-size:17px;line-height:1.65;color:{TEXT_LIGHT};">
              A giudicare da {_a(nota)}, potrebbe fare proprio al caso tuo.
            </p>"""
    else:
        nota_para = ""
    html_body = f"""
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
  NeatX per {nome} · meno telefonate, meno clienti che non si presentano — ti mostro come funziona in 5 minuti.&nbsp;&zwnj;
</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
       style="background-color:{BRAND_DARK};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <!-- Colonna principale -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600"
             class="col" style="width:600px;max-width:600px;background-color:{BRAND_NAVY};
             border:1px solid {BRAND_BORDER};border-radius:16px;overflow:hidden;
             box-shadow:0 20px 60px rgba(0,0,0,.55);">

        <!-- BANNER: sfondo scuro + wordmark -->
        <tr>
          <td align="center" style="padding:34px 24px 28px 24px;background-color:{BRAND_DARK};">
            <a href="{BRAND_URL}" style="text-decoration:none;">{_wordmark_html()}</a>
            <div style="height:8px;font-size:0;">&nbsp;</div>
            <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;
                      line-height:1.5;color:{TEXT_MUTED};">Prenotazioni online per saloni di bellezza</p>
          </td>
        </tr>

        <!-- CORPO -->
        <tr>
          <td style="padding:32px 40px 16px 40px;background-color:{BRAND_NAVY};">
            <p style="margin:0 0 20px 0;font-family:Arial,Helvetica,sans-serif;
                      font-size:17px;line-height:1.65;color:{TEXT_LIGHT};">Ciao,</p>
            <p style="margin:0 0 20px 0;font-family:Arial,Helvetica,sans-serif;
                      font-size:17px;line-height:1.65;color:{TEXT_LIGHT};">
              ti scrivo da <strong>NeatX</strong>, il software di prenotazioni online per chi lavora
              su appuntamento — come <strong>{_a(nome)}</strong>.
            </p>
            <p style="margin:0 0 20px 0;font-family:Arial,Helvetica,sans-serif;
                      font-size:17px;line-height:1.65;color:{TEXT_LIGHT};">
              NeatX non è nato a tavolino: è nato dai <strong>problemi veri</strong> di chi sta dietro
              la poltrona o alla cassa di un salone. Il telefono che squilla mentre hai le mani
              occupate, la cliente che prenota e poi non si presenta, l&apos;agenda piena di buchi.
            </p>
            <p style="margin:0 0 20px 0;font-family:Arial,Helvetica,sans-serif;
                      font-size:17px;line-height:1.65;color:{TEXT_LIGHT};">
              Immagina i tuoi clienti che prenotano <strong>online (24/7)</strong>, versano un
              <strong>acconto all&apos;appuntamento</strong> e ricevono un <strong>promemoria automatico</strong>.
              Il risultato? Meno telefonate, meno clienti che non si presentano, più tempo per lavorare.
            </p>
            {nota_para}
            <p style="margin:0 0 28px 0;font-family:Arial,Helvetica,sans-serif;
                      font-size:17px;line-height:1.65;color:{TEXT_LIGHT};">
              <strong>Zero commissioni</strong> sulle prenotazioni: paghi solo un fisso mensile.
            </p>
            <p style="margin:0 0 28px 0;font-family:Arial,Helvetica,sans-serif;
                      font-size:17px;line-height:1.65;color:{TEXT_LIGHT};">
              Ti va di <strong>provarlo gratis per 14 giorni</strong>? Senza carta di credito.
            </p>

            <!-- CTA (button pill ciano come sul sito) -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
              <tr>
                <td align="center" style="border-radius:999px;background-color:{BRAND_CYAN};">
                  <a href="{BRAND_URL}"
                     style="display:inline-block;padding:14px 32px;font-family:Arial,Helvetica,sans-serif;
                            font-size:16px;font-weight:bold;color:#03111f;text-decoration:none;
                            border-radius:999px;">Prova NeatX gratis per 14 giorni</a>
                </td>
              </tr>
            </table>
            <p style="margin:14px 0 0 0;text-align:center;font-family:Arial,Helvetica,sans-serif;
                      font-size:13px;color:{TEXT_MUTED};">Se ti va, ti faccio vedere come funziona in 5 minuti.</p>
          </td>
        </tr>

        <!-- FIRMA -->
        <tr>
          <td style="padding:6px 40px 32px 40px;background-color:{BRAND_NAVY};">
            <div style="height:1px;background-color:{BRAND_BORDER};margin:0 0 22px 0;"></div>
            <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:16px;
                      line-height:1.5;color:{TEXT_LIGHT};font-weight:bold;">A presto,</p>
            <p style="margin:2px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;
                      line-height:1.5;color:{TEXT_LIGHT};">Lorenzo Bisceglie</p>
            <p style="margin:0 0 4px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;
                      color:{BRAND_CYAN};font-weight:bold;">NeatX — {BRAND_URL}</p>
            <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;
                      color:{TEXT_MUTED};">Prenotazioni online per saloni di bellezza</p>
          </td>
        </tr>

        <!-- FOOTER / UNSUBSCRIBE (GDPR + anti-spam) -->
        <tr>
          <td align="center" style="padding:16px 24px 22px 24px;background-color:{BRAND_DARK};">
            <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;
                      line-height:1.6;color:{TEXT_MUTED};">
              Questo è un messaggio commerciale da <a href="{BRAND_URL}" style="color:{BRAND_CYAN};text-decoration:none;">NeatX</a>.
              Puoi disiscriverti in qualsiasi momento con un click, direttamente da Gmail.
            </p>
          </td>
        </tr>

      </table>
      <p style="margin:16px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;
                color:#64748b;text-align:center;">© {BRAND_URL} · NeatX Software. Tutti i diritti riservati.</p>
    </td>
  </tr>
</table>
"""

    oggetto = f"{nome} — meno telefonate, più prenotazioni?"

    return {"oggetto": oggetto, "testo": testo, "html": html_body}


# --- Invio via Gmail SMTP ---

def send_email(to_email: str, subject: str, body_text: str, body_html: str) -> bool:
    if not GMAIL_USER or not GMAIL_PASS:
        print(f"[!] Credenziali Gmail mancanti. L'email per {to_email} NON inviata.")
        print("[!] Imposta GMAIL_USER e GMAIL_PASS nel file .env")
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = GMAIL_USER
        msg["To"] = to_email
        msg["Subject"] = Header(subject, "utf-8")
        # Header di disiscrizione: fa comparire in Gmail il bottone "Annulla iscrizione"
        # (RFC 2369, richiesto anche dall'anti-spam di Gmail/Yahoo).
        msg["List-Unsubscribe"] = f"<mailto:{GMAIL_USER}?subject=Annulla%20iscrizione>"
        msg["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click"
        # Prima il testo puro, poi l'HTML: i client lo usano come fallback (e aiuta l'anti-spam).
        msg.attach(MIMEText(body_text, _subtype="plain", _charset="utf-8"))
        msg.attach(MIMEText(body_html, _subtype="html", _charset="utf-8"))
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
            # Mostra la versione testo (leggibile); l'HTML è pronto e verrà inviato davvero.
            print(email["testo"])
            continue

        ok = send_email(salon["email_destinatario"], email["oggetto"], email["testo"], email["html"])
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
