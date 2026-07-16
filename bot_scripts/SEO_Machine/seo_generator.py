import os
import re
from datetime import datetime
from google import genai
from google.genai import types

BLOG_DIR = r"C:\Users\Lxxmtq\Documents\Korsakoff\NeatX\DemoNeatXApp\content\blog"

def setup_gemini():
    try:
        with open("../Social/ReelGenerator/auto_bot.py", "r", encoding="utf-8") as f:
            content = f.read()
            match = re.search(r'GEMINI_API_KEY\s*=\s*"([^"]+)"', content)
            if match:
                client = genai.Client(api_key=match.group(1))
                return True
    except Exception as e:
        print(f"[!] Errore recupero API Key: {e}")
    return False

def post_process(testo):
    import re
    testo = re.sub(r'(?m)^\*\*(H[12]|Titolo|Introduzione|Corpo|Presentazione|Call to Action)[:\s]*\*\*', '', testo)
    testo = re.sub(r'(?m)^(H[12]:)\s*', '', testo)
    testo = re.sub(r'(?m)^\d+\.\s*\*\*(.+?)\*\*[:*]?\s*$', r'## \1', testo)
    testo = re.sub(r'\n{3,}', '\n\n', testo)
    return testo.strip()

def genera_articolo_seo(argomento):
    print(f"\n[*] Analisi SEO in corso per l'argomento: '{argomento}'...")
    
    prompt = f"""
Sei un Copywriter SEO esperto di posizionamento su Google.
Scrivi un articolo di blog completo e ottimizzato per i motori di ricerca sull'argomento: "{argomento}".

Il tuo obiettivo finale è convincere il lettore che 'NeatX' è la soluzione definitiva.
Ecco le funzionalità reali di NeatX da menzionare (non inventare altro):
- **Gestione orari** — blocco orari e ferie, disponibilità personalizzata per giorno
- **Fogli presenze** — timesheet esportabile in CSV per il commercialista, ore lavorate per ogni collaboratore
- **Pacchetti messaggi** — crediti SMS/WhatsApp ricaricabili (da 39€ per 500 messaggi)
- **Invita clienti** — link referral brandizzato per invitare nuovi clienti tramite messaggio
- **Recupero clienti** — invio automatico di messaggi con sconto integrati ai clienti che non tornano da 30+ giorni

Struttura richiesta in Markdown (usa esattamente questo formato, mai label come "H1:" o "H2:"):
# Titolo SEO accattivante
## Introduzione
Testo introduttivo...
## [Titolo sezione corpo]
Testo del corpo...
## [Titolo sezione funzionalità]
Testo su una funzionalità specifica...
## Call to Action
Testo finale...

Regole:
- Scrivi SOLO in Markdown puro (usa # e ## veri, mai "H1:" o "H2:").
- Scrivi in italiano, tono professionale ma coinvolgente.
- Almeno 400 parole.
- Non includere frontmatter, nessun preambolo, solo il Markdown.
- Inserisci in modo organico due box promozionali all'interno dell'articolo (uno a metà testo e uno alla fine).
- Il testo del box deve sembrare un consiglio utile, ad esempio: "💡 TIP: Se perdi ore a pensare a cosa scrivere sui social del tuo salone, abbiamo creato 'L'Arsenale dei Prompt': 50 comandi già pronti da copiare e incollare su ChatGPT per fare post perfetti in 3 minuti. [Scoprili qui: https://tinyurl.com/neatxprompt]"
- Assicurati che il link https://tinyurl.com/neatxprompt sia cliccabile nel Markdown. Adatta il tono della promozione al contesto.
"""
    try:
        print("[*] Gemini sta scrivendo l'articolo (potrebbe richiedere 10-20 secondi)...")
        response = client.models.generate_content(model="gemini-3.5-flash", contents=prompt)
        return post_process(response.text.strip())
    except Exception as e:
        print(f"[!] Errore durante la generazione con Gemini: {e}")
        return None

def salva_articolo(testo, argomento):
    if not os.path.exists(BLOG_DIR):
        os.makedirs(BLOG_DIR)
        
    nome_pulito = re.sub(r'[^a-zA-Z0-9]', '-', argomento).lower().strip('-')
    data_odierna = datetime.now().strftime("%Y-%m-%d")
    slug = nome_pulito
    nome_file = f"{slug}.md"
    
    desc = argomento[:120] if len(argomento) > 120 else argomento
    frontmatter = f"---\ntitle: \"{argomento}\"\ndate: \"{data_odierna}\"\ndescription: \"{desc}\"\nslug: \"{slug}\"\n---\n\n"
    
    path_completo = os.path.join(BLOG_DIR, nome_file)
    with open(path_completo, "w", encoding="utf-8") as f:
        f.write(frontmatter + testo)
        
    print(f"\n[+] ARTICOLO GENERATO CON SUCCESSO E INTEGRATO NELL'APP!")
    print(f"[+] Salvato in: {path_completo}")

if __name__ == "__main__":
    print("=========================================")
    print("        NEATX SEO MACHINE (BLOG)         ")
    print("=========================================")
    if setup_gemini():
        argomento = input("\n[?] Inserisci l'argomento (es. 'Gestione appuntamenti Tatuatori'): ")
        if argomento.strip():
            articolo = genera_articolo_seo(argomento.strip())
            if articolo:
                salva_articolo(articolo, argomento.strip())
    else:
        print("[!] Errore: Configurazione API fallita. Verifica il file auto_bot.py")
