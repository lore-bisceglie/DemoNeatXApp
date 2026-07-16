#!/usr/bin/env python3
"""
Tattica 1: Il Vampiro di Treatwell (Competitor Hijack)
Genera link personalizzati all'Audit Page dinamica di NeatX e li invia via email ai target.
"""

import os
import smtplib
import urllib.parse
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

GMAIL_USER = os.getenv("GMAIL_USER")
GMAIL_PASS = os.getenv("GMAIL_PASS")
BASE_URL = os.getenv("NEXT_PUBLIC_ROOT_DOMAIN", "neatx.store")
if not BASE_URL.startswith("http"):
    BASE_URL = f"https://{BASE_URL}"

# Demo Data: In produzione questo verrebbe popolato da uno scraper Google Maps (Apify/Puppeteer)
target_salons = [
    {
        "nome": "Barberia Rossi",
        "email_destinatario": "test.barberiarossi@example.com", 
        "competitor": "Treatwell"
    },
    {
        "nome": "Glamour Beauty Roma",
        "email_destinatario": "test.glamour@example.com",
        "competitor": "Uala"
    }
]

def generate_audit_link(salon_name):
    """Crea lo slug per il routing dinamico di Next.js (es. Barberia Rossi -> barberia-rossi)"""
    slug = salon_name.lower().replace(" ", "-")
    # Pulisce eventuali caratteri speciali
    slug = "".join(c for c in slug if c.isalnum() or c == '-')
    return f"{BASE_URL}/audit/{slug}"

def send_vampire_email(salon):
    to_email = salon["email_destinatario"]
    audit_link = generate_audit_link(salon["nome"])
    
    subject = f"Avete perso 3.500€ quest'anno con {salon['competitor']}?"
    
    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <p>Ciao Team di <strong>{salon['nome']}</strong>,</p>
        
        <p>Stavo guardando la vostra scheda online e ho notato che usate {salon['competitor']} per le prenotazioni.</p>
        
        <p>Facendo due calcoli sui volumi di un salone come il vostro (circa 10 appuntamenti al giorno gestiti tramite app), 
        ho stimato che l'anno scorso avete lasciato a {salon['competitor']} circa <strong>3.500€ in sole commissioni</strong>.</p>
        
        <p>Ho creato un piccolo report dinamico personalizzato per voi con i calcoli esatti e l'impatto a 5 anni:</p>
        
        <p><a href="{audit_link}" style="background-color: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Vedi il Report di {salon['nome']}
        </a></p>
        <br>
        <p>Se il link non funziona: <a href="{audit_link}">{audit_link}</a></p>
        
        <p>Sono uno dei creatori di NeatX, una nuova agenda per saloni <strong>totalmente a zero commissioni</strong>.</p>
        <p>Dategli un'occhiata, potreste risparmiare migliaia di euro quest'anno.</p>
        
        <p>A presto,<br>Il team NeatX</p>
    </body>
    </html>
    """

    if not GMAIL_USER or not GMAIL_PASS:
        print(f"[!] Credenziali Gmail mancanti. Non invio a {salon['nome']} ({to_email})")
        print(f"    Link generato: {audit_link}")
        return False
        
    try:
        msg = MIMEMultipart()
        msg['From'] = GMAIL_USER
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'html'))
        
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(GMAIL_USER, GMAIL_PASS)
        server.send_message(msg)
        server.quit()
        
        print(f"[✅] Trappola scattata! Email inviata a {salon['nome']} -> {to_email}")
        return True
    except Exception as e:
        print(f"[!] Errore SMTP invio a {salon['nome']}: {e}")
        return False

def main():
    print("=========================================")
    print(" 🧛‍♂️ IL VAMPIRO DI TREATWELL ATTIVO ")
    print("=========================================\n")
    
    for salon in target_salons:
        send_vampire_email(salon)
        
    print(f"\n[+] Operazione completata. Le trappole sono state consegnate.")

if __name__ == "__main__":
    main()
