#!/usr/bin/env python3
"""
NeatX Cold Emailer (Il Venditore a Freddo)
Genera email di vendita "su misura" per i saloni, analizzando il loro nome o stile
e proponendo l'agenda NeatX in modo personalizzato grazie a Gemini AI.
"""

import os
import json
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

try:
    from google import genai
    from google.genai import types
except ImportError:
    print("[!] google-generativeai non è installato. Esegui: pip install google-generativeai")
    exit(1)

# Configurazione API Key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("[!] Errore: GEMINI_API_KEY non trovata. Inseriscila nei Secrets di GitHub o nel file .env")
    exit(1)

client = genai.Client(api_key=GEMINI_API_KEY)

# Lista finta (demo) di saloni che vogliamo contattare oggi
target_salons = [
    {
        "nome": "Barberia Il Rasoio",
        "citta": "Milano",
        "stile": "Old school, tagli classici, clientela maschile affezionata",
        "problema_attuale": "Hanno ancora l'agenda cartacea e perdono chiamate mentre lavorano."
    },
    {
        "nome": "Glamour Beauty Center",
        "citta": "Roma",
        "stile": "Lusso, estetica avanzata, unghie e massaggi",
        "problema_attuale": "Hanno tanti no-show (clienti che prenotano e non si presentano)."
    }
]

def generate_cold_email(salon):
    print(f"[*] Analisi del salone '{salon['nome']}' in corso...")
    
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
5. Usa il formato JSON per restituire l'oggetto e il corpo della mail.

Restituisci ESATTAMENTE e SOLO questo formato JSON:
{{
    "oggetto": "oggetto accattivante della mail",
    "corpo_email": "Testo completo dell'email, usa \\n per andare a capo"
}}
"""

    try:
        response = client.models.generate_content(model="gemini-1.5-flash", contents=prompt)
        # Pulisco il testo in caso di formattazione markdown
        json_text = response.text.strip().replace("```json", "").replace("```", "")
        email_data = json.loads(json_text)
        return email_data
    except Exception as e:
        print(f"[!] Errore durante la generazione dell'email per {salon['nome']}: {e}")
        return None

def main():
    print("=========================================")
    print("[*] AVVIO NEATX COLD EMAILER")
    print("=========================================\n")
    
    output_dir = Path("email_generate")
    output_dir.mkdir(exist_ok=True)
    
    for salon in target_salons:
        email = generate_cold_email(salon)
        if email:
            print("\n" + "-"*50)
            print(f"[*] EMAIL PRONTA PER: {salon['nome']}")
            print(f"[*] OGGETTO: {email['oggetto']}")
            print("-" * 50)
            print(email['corpo_email'])
            print("-" * 50 + "\n")
            
            # Salva la mail in un file di testo
            safe_name = salon['nome'].replace(" ", "_").lower()
            file_path = output_dir / f"email_{safe_name}.txt"
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(f"A: {salon['nome']} ({salon['citta']})\n")
                f.write(f"OGGETTO: {email['oggetto']}\n")
                f.write("="*40 + "\n\n")
                f.write(email['corpo_email'])
            
    print(f"\n[+] Tutte le email sono state generate e salvate nella cartella '{output_dir}'.")
    print("[*] Pronto per fare copia-incolla sul tuo Gmail e inviare!")

if __name__ == "__main__":
    main()
