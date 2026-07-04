import os
import json
import random
import subprocess
import requests
import re
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
PEXELS_API_KEY = os.environ.get("PEXELS_API_KEY")

TARGET_AUDIENCES = [
    "Parrucchieri",
    "Centri Estetici",
    "Fisioterapisti",
    "Osteopati",
    "Massaggiatori",
    "Psicologi",
    "Nutrizionisti",
    "Personal Trainer",
    "Avvocati",
    "Commercialisti"
]

GAMEPLAY_STYLES = [
    "runner",
    "block_miner",
    "neon_racer"
]

def generate_daily_content():
    target = random.choice(TARGET_AUDIENCES)
    gameplay_style = random.choice(GAMEPLAY_STYLES)
    print(f"[*] Target di oggi selezionato: {target}")
    print(f"[*] Gameplay di oggi selezionato: {gameplay_style}")

    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY mancante. Impostalo nei GitHub Secrets o nel file .env locale.")
    
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-2.5-flash', generation_config={"response_mime_type": "application/json"})
    
    history_context = ""
    if os.path.exists("history.json"):
        try:
            with open("history.json", "r", encoding="utf-8") as f:
                history = json.load(f)
            if history:
                # Ordina per views (i migliori prima)
                history.sort(key=lambda x: x.get("views", 0), reverse=True)
                history_context = "\n[AUTO-APPRENDIMENTO: DATI STORICI]\nEcco i risultati dei video passati su YouTube (usa questi dati per capire cosa funziona!):\n"
                for record in history[:10]: # Prendi i 10 migliori
                    history_context += f"- Video '{record.get('title')}' (Hook: '{record.get('hook')}'): {record.get('views', 0)} visualizzazioni, {record.get('likes', 0)} likes.\n"
                history_context += "Analizza quali temi/hooks hanno ottenuto più visualizzazioni e crea un contenuto simile, ma nuovo!\n"
        except:
            pass

    prompt = f"""
Sei un esperto di marketing virale su Instagram e TikTok (stile ADHD retention).
Stai promuovendo 'NeatX', un'app geniale per prenotazioni automatiche online.

Scrivi un copione mirato per: {target}.
Il tema "{target}" deve guidare TUTTO: copione, hook, titolo, caption, immagine e promessa.
Non citare o descrivere altre professioni.
Lo sfondo superiore sara un gameplay stile "{gameplay_style}", quindi il testo deve restare leggibile e veloce.

{history_context}
Regole:
- Il video dura circa 20-30 secondi.
- Usa uno stile diretto, provocatorio ma professionale. Fai capire che stanno perdendo tempo a rispondere su WhatsApp o al telefono.
- Alla fine del video DEVI dire chiaramente: "Vuoi automatizzare tutto? Commenta la parola AGENDA qui sotto e ti invio il link in privato!".
- Il copione deve essere breve (circa 20-30 secondi parlati), super naturale e NON sembrare un robot che legge. Usa un tono energico e informale. NIENTE EMOJI NEL COPIONE PARLATO. LE EMOJI SONO SEVERAMENTE VIETATE IN script_text.
- L'hook del copione deve toccare un punto di dolore ESTREMO del target. Sii aggressivo, fagli capire che stanno buttando soldi e tempo (es: "Sei un tatuatore e continui a prendere appuntamenti su WhatsApp? Stai perdendo soldi.").
- La scritta a schermo (hook_text) DEVE ESSERE IDENTICA a cover_title. Saranno le 3-4 parole enormi che appaiono in faccia all'utente.
- La caption di Instagram deve essere persuasiva e contenere hashtag rilevanti e l'invito a commentare la parola AGENDA.
- Il "cover_title" deve essere MASSIMO 4 PAROLE, enorme e scioccante (es: TATUATORI: BASTA NO-SHOW! oppure SMETTILA DI PERDERE CLIENTI).
- Il "image_prompt" deve essere in INGLESE e descrivere una scena fotografica coerente con {target}, con un professionista vero al lavoro nel suo ambiente.

Formatta la risposta ESATTAMENTE come questo JSON (senza markdown, senza backtick):
{{
  "niche": "{target}",
  "script_text": "il copione letto dalla voce, aggressivo e dritto al punto",
  "hook_text": "DEVE ESSERE IDENTICO AL COVER_TITLE",
  "cover_title": "TITOLO SHOCK MAX 4 PAROLE",
  "image_prompt": "prompt fotografico coerente con il target",
  "gameplay_style": "{gameplay_style}",
  "caption": "la descrizione per instagram con hashtag"
}}
"""

    print("[*] Contattando il cervello di Google Gemini 1.5 Pro...")
    response = model.generate_content(prompt)
    
    content = response.text.strip()
    
    data = json.loads(content)
    data["niche"] = target
    data["gameplay_style"] = data.get("gameplay_style") or gameplay_style
    if data["gameplay_style"] not in GAMEPLAY_STYLES:
        data["gameplay_style"] = gameplay_style
    if not data.get("image_prompt"):
        data["image_prompt"] = f"photorealistic {target} professional working in a modern real workplace"
    if data.get("cover_title"):
        data["hook_text"] = data["cover_title"]
    
    # Rimuovi forzatamente eventuali emoji dal testo parlato per evitare che l'audio le pronunci
    data["script_text"] = re.sub(r'[^\w\s,.\'!?àèìòùÀÈÌÒÙ-]', '', data["script_text"])
    
    # Salva il dato su file così gli altri script possono leggerlo
    with open("reel_data.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
        
    print("[+] Copione e testi creati con successo da Gemini e salvati in reel_data.json!")
    return data

def download_pexels_video(query):
    if not PEXELS_API_KEY:
        print("[!] PEXELS_API_KEY mancante. Salto il download Pexels e uso il fallback video se disponibile.")
        return False

    print(f"[*] Ricerca video Pexels per la query: '{query}'...")
    url = f"https://api.pexels.com/videos/search?query={query}&orientation=portrait&size=medium&per_page=15"
    headers = {"Authorization": PEXELS_API_KEY}
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        if data.get("videos"):
            # Scegliamo un video a caso dalla prima pagina per variare
            video = random.choice(data["videos"])
            # Troviamo il file video di qualità HD
            video_files = video.get("video_files", [])
            
            # Preferiamo qualità HD (es. 720p o 1080p), fallback su quello disponibile
            hd_files = [vf for vf in video_files if vf.get("quality") == "hd"]
            if hd_files:
                selected_file = sorted(hd_files, key=lambda x: x.get("width", 0), reverse=True)[0]
            elif video_files:
                selected_file = video_files[0]
            else:
                raise Exception("Nessun link file trovato nel video di Pexels.")
                
            video_link = selected_file["link"]
            print(f"[*] Scaricamento video da Pexels in corso...")
            
            r = requests.get(video_link, stream=True)
            if r.status_code == 200:
                if not os.path.exists("assets"):
                    os.makedirs("assets")
                with open("assets/dynamic_bg.mp4", "wb") as f:
                    for chunk in r.iter_content(chunk_size=8192):
                        f.write(chunk)
                print("[+] Video dinamico scaricato con successo in assets/dynamic_bg.mp4!")
                return True
        else:
            print("[!] Nessun video trovato su Pexels per questa query.")
    except Exception as e:
        print(f"[!] Errore durante lo scaricamento da Pexels: {e}")
        
    return False

def run_pipeline():
    print("=========================================")
    print("[*] AVVIO BOT AUTOMATICO NEATX [*]")
    print("=========================================\n")
    
    # 0. Analisi statistiche (Auto-apprendimento)
    print("[*] Aggiornamento statistiche storiche dei video...")
    try:
        import analyze_stats
        analyze_stats.update_history_stats()
    except Exception as e:
        print(f"[!] Errore durante l'aggiornamento statistiche: {e}")
    print("-----------------------------------------")
    
    # 1. Genera il contenuto
    data = generate_daily_content()
    
    # 1.5 Il gameplay viene scelto/generato dentro generate_reel.py.
    print(f"[*] Sfondo gameplay richiesto: {data.get('gameplay_style', 'runner')}")
    
    # 2. Monta il video (usando il video registrato manualmente app_demo.mp4)
    print("\n[*] Esecuzione generate_reel.py...")
    subprocess.run(["python", "generate_reel.py"], check=True)
    
    # 4. Pubblica
    print("\n[*] Esecuzione publish_reel.py...")
    subprocess.run(["python", "publish_reel.py"], check=True)
    
    print("\n[+] CICLO COMPLETATO! IL REEL E' ONLINE!")

if __name__ == "__main__":
    run_pipeline()
