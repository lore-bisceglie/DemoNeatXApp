import os
import re
import time
import random
import subprocess
import json
import sys
from datetime import datetime
from google import genai
from google.genai import types

# Percorsi relativi (adatti sia per locale che per GitHub Actions)
APP_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BLOG_DIR = os.path.join(APP_DIR, "content", "blog")
STRATEGY_BRIEF = os.path.join(APP_DIR, "content_strategy", "today_brief.json")
sys.path.insert(0, os.path.join(APP_DIR, "bot_scripts", "Automation"))
from ai_provider import openai_text

def load_strategy_brief():
    if not os.path.exists(STRATEGY_BRIEF):
        return {}
    try:
        with open(STRATEGY_BRIEF, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[!] Strategia contenuti non leggibile: {e}")
        return {}

def setup_gemini():
    try:
        api_key = os.environ.get("GEMINI_API_KEY")
        if api_key:
            client = genai.Client(api_key=api_key)
            return True

        # Se siamo su GitHub Actions, la chiave è nelle Environment Variables
        if os.environ.get("GITHUB_ACTIONS"):
            print("[!] GEMINI_API_KEY non trovata nelle variabili d'ambiente.")
            return False
                
        # Fallback per l'esecuzione locale
        bot_script_path = os.path.join(APP_DIR, "bot_scripts", "Social", "ReelGenerator", "auto_bot.py")
        with open(bot_script_path, "r", encoding="utf-8") as f:
            content = f.read()
            match = re.search(r'GEMINI_API_KEY\s*=\s*"([^"]+)"', content)
            if match:
                client = genai.Client(api_key=match.group(1))
                return True
    except Exception as e:
        print(f"[!] Errore recupero API Key: {e}")
    return False

def has_openai():
    return bool(os.environ.get("OPENAI_API_KEY"))

def inventa_argomento():
    brief = load_strategy_brief()
    if brief.get("blog_topic"):
        print(f"\n[*] Strategia: uso argomento blog del giorno: {brief['blog_topic']}")
        return brief["blog_topic"]

    # Scegliamo un target random per avere varietà
    target = random.choice(["Barbieri", "Estetiste e Centri Estetici", "Tatuatori", "Studi Medici e Fisioterapisti", "Consulenti e Coach"])
    print(f"\n[*] IA: Sto inventando un argomento virale per il target: {target}...")
    
    prompt = f"""Sei un marketer esperto. Inventa UN (1) solo titolo accattivante e specifico per un articolo di blog SEO.
    L'articolo è rivolto a: {target}.
    Deve trattare di problemi legati alla gestione del tempo, no-show (clienti che non si presentano), organizzazione dell'agenda, o come aumentare i guadagni.
    Rispondi SOLO con il titolo dell'articolo, senza virgolette e senza testo aggiuntivo."""

    openai_title = openai_text(
        prompt,
        system="Sei un strategist SEO italiano. Rispondi solo con il titolo richiesto.",
        max_tokens=120,
    )
    if openai_title:
        titolo = openai_title.strip().replace('"', '')
        print(f"[+] OpenAI ha scelto l'argomento: '{titolo}'")
        return titolo
    
    try:
        if not setup_gemini():
            return f"Come gestire al meglio gli appuntamenti per {target}"
        response = client.models.generate_content(model="gemini-3.5-flash", contents=prompt)
        titolo = response.text.strip().replace('"', '')
        print(f"[+] L'IA ha scelto l'argomento: '{titolo}'")
        return titolo
    except Exception as e:
        print(f"[!] Errore generazione argomento: {e}")
        return f"Come gestire al meglio gli appuntamenti per {target}"

def post_process(testo):
    testo = re.sub(r'(?m)^\*\*(H[12]|Titolo|Introduzione|Corpo|Presentazione|Call to Action)[:\s]*\*\*', '', testo)
    testo = re.sub(r'(?m)^(H[12]:)\s*', '', testo)
    testo = re.sub(r'(?m)^\d+\.\s*\*\*(.+?)\*\*[:*]?\s*$', r'## \1', testo)
    testo = re.sub(r'\n{3,}', '\n\n', testo)
    return testo.strip()

def genera_articolo_seo(argomento):
    print(f"[*] IA: Sto scrivendo un articolo SEO approfondito su '{argomento}'...")
    
    prompt = f"""
Sei un Copywriter d'assalto e spietato, esperto di SEO e Marketing per la nicchia '{argomento}'.
Lavori per 'NeatX', un software SaaS gestionale per professionisti su appuntamento (saloni, barbieri, centri estetici).

Obiettivo: Scrivere un articolo di blog SEO bomba per far capire al lettore che NeatX è superiore a tutto (e in particolare ad app generaliste come Treatwell o BarberApp che rubano l'identità del brand).

Argomento o problema da trattare: "{argomento}"

Criteri di scrittura (Prompting Operativo Avanzato):
- **Angolo non ovvio**: Spiega la cosa che nessuno ha il coraggio di dire al tuo target (es. "Se il servizio è prenota gratis, la disdetta psicologica è gratis", oppure "Guardare a fine sera quanti soldi hai fatto è inutile").
- **Anticipa obiezioni**: Il target farà obiezioni tipo "Ma se chiedo l'acconto i clienti scappano", oppure "Ma Treatwell mi porta clienti nuovi". Scrivi il testo in modo da smontarle prima che le pensino.
- **Ritmo e Tono**: Ritmo incalzante e veloce. Frasi brevi e dritte al punto. Niente burocratese. Devi sembrare il loro manager che gli spiega dove stanno sbagliando.
- **Formattazione**: Scrivi SOLO in Markdown puro (usa # e ## veri). Almeno 500 parole. 
- **Chiusura**: Chiudi sempre l'articolo vendendo elegantemente la soluzione definitiva: usare NeatX. 

Ecco le funzionalità reali di NeatX da menzionare per risolvere il loro problema:
- **Gestione Acconti su Stripe** — per annullare i no-show.
- **Nessun bot vocale** — l'interazione è pulita, privata e testuale.
- **App Privata White-Label** — per non essere confusi nell'elenco infinito dei competitor.
- **Fogli presenze e Analytics** — per sapere quale servizio porta più margine.

Inserisci due box promozionali testuali (es: "💡 TIP: [promozione]") in modo organico. Usa questo link: https://tinyurl.com/neatxprompt.
"""
    openai_article = openai_text(
        prompt,
        system="Sei un copywriter SEO italiano esperto di SaaS per prenotazioni. Scrivi markdown pulito.",
        max_tokens=2600,
    )
    if openai_article:
        print("[+] Articolo SEO scritto con OpenAI.")
        return post_process(openai_article.strip())

    try:
        if not setup_gemini():
            return None
        response = client.models.generate_content(model="gemini-3.5-flash", contents=prompt)
        return post_process(response.text.strip())
    except Exception as e:
        print(f"[!] Errore scrittura articolo: {e}")
        return None

def salva_articolo(testo, argomento):
    if not os.path.exists(BLOG_DIR):
        os.makedirs(BLOG_DIR)
        
    # Pulizia del nome file (slug)
    slug = re.sub(r'[^a-zA-Z0-9]', '-', argomento).lower().strip('-')
    slug = re.sub(r'-+', '-', slug) # rimuove trattini multipli
    data_odierna = datetime.now().strftime("%Y-%m-%d")
    nome_file = f"{slug}.md"
    
    desc = argomento[:120] if len(argomento) > 120 else argomento
    frontmatter = f"---\ntitle: \"{argomento}\"\ndate: \"{data_odierna}\"\ndescription: \"{desc}\"\nslug: \"{slug}\"\n---\n\n"
    
    path_completo = os.path.join(BLOG_DIR, nome_file)
    with open(path_completo, "w", encoding="utf-8") as f:
        f.write(frontmatter + testo)
        
    print(f"[+] File salvato in: {path_completo}")
    return nome_file

def git_push_to_vercel(nome_file):
    if os.environ.get("GITHUB_ACTIONS"):
        print("\n[*] Bot: Sono su GitHub Actions. Il push verrà gestito dallo step successivo (git-auto-commit-action).")
        return True
        
    print("\n[*] Bot: Avvio la procedura di caricamento su Vercel (Git Push)...")
    try:
        # Ci posizioniamo nella cartella della Web App
        os.chdir(APP_DIR)
        
        # Git Add
        subprocess.run(["git", "add", "."], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print("  - Git Add completato")
        
        # Git Commit
        commit_msg = f"Auto-SEO: Aggiunto articolo '{nome_file}'"
        subprocess.run(["git", "commit", "-m", commit_msg], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print("  - Git Commit completato")
        
        # Git Push
        subprocess.run(["git", "push", "origin", "main"], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print("  - Git Push completato! Vercel sta compilando il sito online.")
        
        return True
    except subprocess.CalledProcessError as e:
        print(f"[!] Errore Git (forse non ci sono modifiche o credenziali mancanti): {e}")
        return False
    except Exception as e:
        print(f"[!] Errore imprevisto durante il push: {e}")
        return False

def esegui_ciclo_completo():
    print("\n" + "="*50)
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] INIZIO CICLO AUTO-SEO MACHINE")
    print("="*50)
    
    if not has_openai() and not setup_gemini():
        print("[!] Abortito: Impossibile configurare Gemini.")
        return
        
    argomento = inventa_argomento()
    if argomento:
        articolo = genera_articolo_seo(argomento)
        if articolo:
            nome_file = salva_articolo(articolo, argomento)
            git_push_to_vercel(nome_file)
            
    print("\n" + "="*50)
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] CICLO COMPLETATO CON SUCCESSO")
    print("La macchina entra in letargo fino a domani...")
    print("="*50 + "\n")

if __name__ == "__main__":
    print("=========================================")
    print("    NEATX AUTO-SEO GHOSTWRITER DAEMON    ")
    print("    Lascia questa finestra aperta per    ")
    print("    pubblicare ogni 24 ore.              ")
    print("=========================================")
    
    # Esegue il ciclo una sola volta se è su GitHub Actions
    if os.environ.get("GITHUB_ACTIONS"):
        esegui_ciclo_completo()
        exit(0)
        
    # Esegue il primo ciclo immediatamente all'avvio in locale
    esegui_ciclo_completo()
    
    # Loop infinito: aspetta 24 ore e riparte
    HOURS_TO_WAIT = 24
    while True:
        try:
            time.sleep(HOURS_TO_WAIT * 3600)
            esegui_ciclo_completo()
        except KeyboardInterrupt:
            print("\n[!] Spegnimento della Macchina SEO...")
            break
