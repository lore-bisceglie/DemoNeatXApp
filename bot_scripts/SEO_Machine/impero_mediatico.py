import os
import json
import re
import random
from datetime import datetime
import google.generativeai as genai

# Cartelle
SATELLITES_DIR = r"satellites_content"
COMPETITORS_FILE = "competitors.json"

# Nomi fittizi di testate giornalistiche indipendenti per i blog satelliti
MAGAZINES = ["BarberTech News", "SaloneDigitale.it", "GestionaleParrucchieri.info", "L'Espero del Salone"]

def setup_gemini():
    try:
        # Usa la variabile d'ambiente o .env come nel bot dei commenti
        api_key = os.environ.get("GEMINI_API_KEY", "")
        if not api_key:
            # Fallback alla vecchia lettura se eseguito localmente
            with open("../Social/ReelGenerator/auto_bot.py", "r", encoding="utf-8") as f:
                content = f.read()
                match = re.search(r'GEMINI_API_KEY\s*=\s*"([^"]+)"', content)
                if match:
                    api_key = match.group(1)
        if api_key:
            genai.configure(api_key=api_key)
            return True
    except Exception as e:
        print(f"[!] Errore recupero API Key: {e}")
    return False

def load_competitors():
    if os.path.exists(COMPETITORS_FILE):
        with open(COMPETITORS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def genera_recensione_distruttiva(competitor, magazine):
    print(f"\n[*] La testata '{magazine}' sta scrivendo l'articolo contro {competitor['name']}...")
    
    model = genai.GenerativeModel('gemini-1.5-flash', generation_config={"response_mime_type": "text/plain"})
    
    debolezze = ", ".join(competitor['weaknesses'])
    vantaggio_neatx = competitor['neatx_advantage']
    
    prompt = f"""
    Sei un giornalista indipendente esperto in software per parrucchieri e barbieri, e scrivi per il blog '{magazine}'.
    Devi scrivere una recensione comparativa SEO-ottimizzata tra "{competitor['name']}" e il software di nuova generazione "NeatX".
    
    L'obiettivo è dimostrare in modo "oggettivo" ma spietato che NeatX è di gran lunga superiore, sfruttando i difetti noti di {competitor['name']}.
    
    Difetti di {competitor['name']} da citare come problemi enormi per i barbieri:
    - {debolezze}
    
    Perché NeatX vince a mani basse:
    - {vantaggio_neatx}
    
    Struttura richiesta (Markdown):
    1. **Titolo H1 (clickbait SEO):** Es. "Recensione {competitor['name']} 2026: Conviene davvero o c'è di meglio? (NeatX)"
    2. **Introduzione:** Il problema dei costi e della gestione nei saloni oggi.
    3. **I difetti nascosti di {competitor['name']}:** Elenca e calca la mano sui difetti forniti.
    4. **L'alternativa definitiva: NeatX:** Spiega il vantaggio di NeatX in modo entusiasmante.
    5. **Verdetto Finale:** Chiaro, a favore di NeatX, con una Call to Action aggressiva a visitare il sito ufficiale di NeatX.
    
    Regole:
    - Non dire parolacce, usa un tono professionale ma d'impatto (stile Forbes o testata Tech).
    - Lunghezza minima 500 parole.
    - Non includere frontmatter, restituisci solo il Markdown pulito partendo dall'H1.
    """
    
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"[!] Errore Gemini: {e}")
        return None

def salva_articolo_satellite(testo, competitor_name, magazine):
    if not os.path.exists(SATELLITES_DIR):
        os.makedirs(SATELLITES_DIR)
        
    slug = f"recensione-{competitor_name.lower().replace(' ', '-')}-vs-neatx"
    data_odierna = datetime.now().strftime("%Y-%m-%d")
    nome_file = f"{slug}.md"
    
    frontmatter = f"---\ntitle: \"Recensione {competitor_name}: L'Analisi di {magazine}\"\ndate: \"{data_odierna}\"\nauthor: \"{magazine}\"\nslug: \"{slug}\"\n---\n\n"
    
    path_completo = os.path.join(SATELLITES_DIR, nome_file)
    with open(path_completo, "w", encoding="utf-8") as f:
        f.write(frontmatter + testo)
        
    print(f"[+] Articolo d'assalto salvato con successo in: {path_completo}")

def main():
    print("=========================================")
    print("   NEATX IMPERO MEDIATICO (SATELLITI)    ")
    print("=========================================")
    
    if not setup_gemini():
        print("[!] Errore critico: Impossibile avviare Gemini. Esco.")
        return
        
    competitors = load_competitors()
    if not competitors:
        print("[!] Nessun competitor trovato nel database competitors.json.")
        return
        
    # Scegliamo un competitor e una testata finta a caso
    target = random.choice(competitors)
    magazine = random.choice(MAGAZINES)
    
    articolo = genera_recensione_distruttiva(target, magazine)
    if articolo:
        salva_articolo_satellite(articolo, target['name'], magazine)

if __name__ == "__main__":
    main()
