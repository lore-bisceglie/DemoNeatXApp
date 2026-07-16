#!/usr/bin/env python3
"""
NeatX Cold Emailer (Il Venditore a Freddo) 100% Autonomo
Genera email di vendita "su misura" tramite OmniRoute/AI_Provider e le invia
automaticamente al potenziale cliente tramite Gmail SMTP.
"""

import os
import json
import sys
import smtplib
from pathlib import Path
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

# Assicuriamoci che ai_provider sia importabile aggiungendo il path corretto
bot_scripts_dir = Path(__file__).resolve().parent.parent
if str(bot_scripts_dir) not in sys.path:
    sys.path.append(str(bot_scripts_dir))

try:
    from Automation.ai_provider import openai_json
except ImportError:
    print("[!] Modulo ai_provider non trovato. Esco.")
    exit(1)

# Configurazione Gmail SMTP
GMAIL_USER = os.getenv("GMAIL_USER")
GMAIL_PASS = os.getenv("GMAIL_PASS")

# Lista finta (demo) di saloni che vogliamo contattare oggi
target_salons = [
    {
        "nome": "Barberia Il Rasoio",
        "citta": "Milano",
        "email_destinatario": "test.barberia@example.com", # Da sostituire con vere email
        "stile": "Old school, tagli classici, clientela maschile affezionata",
        "problema_attuale": "Hanno ancora l'agenda cartacea e perdono chiamate mentre lavorano."
    },
    {
        "nome": "Glamour Beauty Center",
        "citta": "Roma",
        "email_destinatario": "test.glamour@example.com",
        "stile": "Lusso, estetica avanzata, unghie e massaggi",
        "problema_attuale": "Hanno tanti no-show (clienti che prenotano e non si presentano)."
    }
]

def generate_cold_email(salon):
    print(f"[*] Analisi del salone '{salon['nome']}' in corso tramite AI...")
    
    prompt = f"""
Sei il direttore vendite di NeatX, un software innovativo per la gestione degli appuntamenti (agenda online) dedicato a parrucchieri e centri estetici.
Devi scrivere una email 'a freddo' a questo potenziale cliente per convincerlo a provare il nostro software.

Dettagli del Salone:
- Nome: {salon['nome']}
- Città: {salon['citta']}
- Stile: {salon['stile']}
- Problema noto: {salon['problema_attuale']}

Regole per l'email:
1. NON deve sembrare un'email automatica o spam.
2. Sii colloquiale, educato e fai un complimento specifico sul loro stile.
3. Affronta direttamente il loro "Problema noto" e spiega come NeatX lo risolve (es. azzerare i no-show, smettere di rispondere al telefono mentre si lavora).
4. Chiudi con una Call To Action (CTA) morbida: chiedi se hanno 5 minuti giovedì per fargli vedere come funziona.
6. Includi SEMPRE un 'P.S.' finale in cui promuovi il nostro nuovo prodotto digitale 'L'Arsenale dei Prompt', spiegando che sono 50 template copia-incolla per ChatGPT per i loro social e inserendo obbligatoriamente questo link: https://tinyurl.com/neatxprompt
7. Usa il formato JSON per restituire l'oggetto e il corpo della mail.

Restituisci ESATTAMENTE e SOLO questo formato JSON:
{{
    "oggetto": "oggetto accattivante della mail",
    "corpo_email": "Testo completo dell'email, usa \\n per andare a capo"
}}
"""
    
    response = openai_json(prompt=prompt, model="gpt-4o-mini")
    if not response:
        print(f"[!] Errore durante la generazione dell'email per {salon['nome']}")
        return None
        
    return response

def send_email_smtp(to_email, subject, body):
    if not GMAIL_USER or not GMAIL_PASS:
        print(f"[!] Credenziali Gmail mancanti. L'email per {to_email} non sarà inviata.")
        return False
        
    try:
        msg = MIMEMultipart()
        msg['From'] = GMAIL_USER
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Sostituisci i \n con <br> per l'HTML
        body_html = body.replace('\\n', '<br>').replace('\n', '<br>')
        msg.attach(MIMEText(body_html, 'html'))
        
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(GMAIL_USER, GMAIL_PASS)
        server.send_message(msg)
        server.quit()
        
        print(f"[✅] Email inviata fisicamente a {to_email}!")
        return True
    except Exception as e:
        print(f"[!] Errore SMTP nell'invio a {to_email}: {e}")
        return False

def main():
    print("=========================================")
    print("[*] AVVIO NEATX COLD EMAILER (100% AUTOMATICO)")
    print("=========================================\n")
    
    output_dir = Path("email_generate")
    output_dir.mkdir(exist_ok=True)
    
    for salon in target_salons:
        email = generate_cold_email(salon)
        if email:
            print("\n" + "-"*50)
            print(f"[*] EMAIL GENERATA PER: {salon['nome']}")
            print(f"[*] OGGETTO: {email['oggetto']}")
            print("-" * 50)
            print(email['corpo_email'])
            print("-" * 50 + "\n")
            
            # 1. Salva la mail in un file di testo come backup
            safe_name = salon['nome'].replace(" ", "_").lower()
            file_path = output_dir / f"email_{safe_name}.txt"
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(f"A: {salon['email_destinatario']}\n")
                f.write(f"OGGETTO: {email['oggetto']}\n")
                f.write("="*40 + "\n\n")
                f.write(email['corpo_email'])
                
            # 2. INVIA L'EMAIL FISICAMENTE!
            send_email_smtp(salon['email_destinatario'], email['oggetto'], email['corpo_email'])
            
    print(f"\n[+] Fine ciclo di vendite. Lavoro completato in totale autonomia.")

if __name__ == "__main__":
    main()
