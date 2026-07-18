import os
import json
import random
import subprocess
import requests
import re
import sys
from pathlib import Path
from google import genai
from google.genai import types
from dotenv import load_dotenv

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parents[2]

# Shared credentials live in the project environment; bot-specific values may
# override them in the ReelGenerator environment.
load_dotenv(REPO_ROOT / ".env", override=False)
load_dotenv(SCRIPT_DIR / ".env", override=True)

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
from hashtag_strategy import build_hashtags, ALWAYS, NICHE_TAGS

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
PEXELS_API_KEY = os.environ.get("PEXELS_API_KEY")
sys.path.insert(0, os.path.join(str(REPO_ROOT), "bot_scripts", "Automation"))
from ai_provider import openai_json

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

# Hashtag ad alto reach virale
ALWAYS_TAGS = " ".join(ALWAYS)
NICHE_TAGS_MAP = {k.lower(): v for k, v in NICHE_TAGS.items()}

GAMEPLAY_STYLES = [
    "runner",
    "block_miner",
    "neon_racer"
]

def load_today_brief():
    path = os.path.join(REPO_ROOT, "content_strategy", "today_brief.json")
    if not os.path.exists(path):
        return {}

    try:
        with open(path, "r", encoding="utf-8") as f:
            brief = json.load(f)
        print(f"[*] Strategia del giorno caricata: {brief.get('niche', 'tema non indicato')}")
        return brief
    except Exception as e:
        print(f"[!] Strategia del giorno non leggibile: {e}")
        return {}

FEATURE_LIST = [
    "timesheet", "recensioni", "analytics", "multi_staff",
    "booking", "promemoria", "no_show", "messaggi", "referral",
]

FEATURE_LABELS = {
    "timesheet": "Timesheet Automatici",
    "recensioni": "Recensioni Automatiche",
    "analytics": "Statistiche e Analisi",
    "multi_staff": "Gestione Staff e Turni",
    "booking": "Prenotazioni 24/7",
    "promemoria": "Promemoria WhatsApp",
    "no_show": "Zero No-Show",
    "messaggi": "Pacchetti Messaggi",
    "referral": "Invita Clienti",
}

FEATURE_PAINS = {
    "timesheet": "ancora segni i turni su Excel a mano",
    "recensioni": "i clienti soddisfatti non lasciano recensioni",
    "analytics": "non sai quanto guadagni davvero ogni mese",
    "multi_staff": "gestire piu collaboratori e un caos",
    "booking": "ancora bloccato al telefono per dare appuntamenti",
    "promemoria": "i clienti dimenticano e non si presentano",
    "no_show": "perdi tempo e soldi con appuntamenti saltati",
    "messaggi": "devi comprare costosi piani SMS che non usi mai",
    "referral": "i tuoi clienti non ti portano nuovi clienti",
}

FEATURE_PROMISES = {
    "timesheet": "timesheet automatici per il commercialista in un click",
    "recensioni": "recensioni Google inviate in automatico dopo ogni appuntamento",
    "analytics": "statistiche in tempo reale su guadagni e performance",
    "multi_staff": "ogni collaboratore con la propria agenda e i propri servizi",
    "booking": "prenotazioni 24/7 senza dover rispondere al telefono",
    "promemoria": "promemoria WhatsApp che riducono i no-show del 90%",
    "no_show": "acconti automatici che filtrano i clienti seri",
    "messaggi": "crediti SMS/WhatsApp ricaricabili senza vincoli",
    "referral": "link referral brandizzato per far pubblicizzare i tuoi clienti",
}

FEATURE_COVERS = {
    "timesheet": "BASTA EXCEL",
    "recensioni": "RECENSIONI AUTOMATICHE",
    "analytics": "SAPER QUANTO GUADAGNI",
    "multi_staff": "GESTIONE STAFF FACILE",
    "booking": "APPUNTAMENTI 24/7",
    "promemoria": "ADDIO NO-SHOW",
    "no_show": "BASTA NO-SHOW",
    "messaggi": "MESSAGGI ILLIMITATI",
    "referral": "CLIENTI CHE PORTANO CLIENTI",
}

FEATURE_SCENES_EN = {
    "no_show": "a smartphone showing a confirmed appointment with a paid deposit, a calendar with the time slot marked as paid and locked, a calm professional in the background",
    "booking": "a client booking an appointment by themselves on a smartphone app while the professional is free and not on the phone, a clean modern booking screen",
    "timesheet": "a digital timesheet dashboard on a screen showing staff shifts and a ready CSV file for the accountant, no paper or spreadsheets",
    "recensioni": "a 5-star Google review notification appearing on a smartphone right after an appointment, a happy satisfied client",
    "promemoria": "a WhatsApp reminder notification on a smartphone about an upcoming appointment, a client who will not forget",
    "analytics": "a real-time analytics dashboard on a screen with revenue charts and performance metrics, a professional reading the numbers",
    "multi_staff": "separate agendas for multiple staff members on a screen with organized shifts and assignments, a calm coordinated team",
}

def build_scene_prompt(target, feature):
    scene = FEATURE_SCENES_EN.get(feature, "professional working")
    return f"photorealistic cinematic scene inside a {target} workplace: {scene}, premium realistic lighting, shallow depth of field"


def build_fallback_content(target, gameplay_style, strategy=None, reason=""):
    strategy = strategy or {}

    if not strategy.get("feature"):
        strategy["feature"] = random.choice(FEATURE_LIST)

    feature = strategy["feature"]
    pain = strategy.get("pain") or FEATURE_PAINS.get(feature, "perdere tempo tra messaggi, telefonate e appuntamenti saltati")
    promise = strategy.get("promise") or FEATURE_PROMISES.get(feature, "prenotazioni automatiche e meno no-show")
    cover_title = strategy.get("cover_title") or FEATURE_COVERS.get(feature, "BASTA NO-SHOW")
    image_prompt = strategy.get("image_prompt") or build_scene_prompt(target, feature)

    if reason:
        print(f"[!] Uso contenuto fallback per il reel: {reason}")
    print(f"[*] Feature del giorno: {FEATURE_LABELS.get(feature, feature)}")
    if feature == "timesheet":
        script_text = (
            f"Se sei tra i {target.lower()} e ancora segni i turni su Excel, "
            f"stai perdendo ore preziose. Il problema e' {pain}. "
            f"Con NeatX puoi avere {promise}, senza fogli ne calcoli a mano. "
            "Vuoi saperne di piu? Commenta INFO qui sotto e ti invio tutto in privato!"
        )
        caption = (
            f"{target}: timesheet automatici per il commercialista. "
            "Commenta INFO o AGENDA e ti mando la demo NeatX. "
            "#NeatX #timesheet #turni #commercialista #automazione"
        )
    elif feature == "recensioni":
        script_text = (
            f"Se sei tra i {target.lower()} e i clienti soddisfatti non lasciano recensioni, "
            f"stai perdendo visibilità. Il problema e' {pain}. "
            f"Con NeatX puoi avere {promise}, in automatico dopo ogni appuntamento. "
            "Vuoi saperne di piu? Commenta INFO qui sotto e ti invio tutto in privato!"
        )
        caption = (
            f"{target}: recensioni Google automatiche. "
            "Commenta INFO o AGENDA e ti mando la demo NeatX. "
            "#NeatX #recensioni #google #automazione #business"
        )
    elif feature == "analytics":
        script_text = (
            f"Se sei tra i {target.lower()} e non sai quanto guadagni davvero ogni mese, "
            f"stai lavorando al buio. Il problema e' {pain}. "
            f"Con NeatX puoi avere {promise}, senza fogli ne calcoli. "
            "Vuoi saperne di piu? Commenta INFO qui sotto e ti invio tutto in privato!"
        )
        caption = (
            f"{target}: statistiche in tempo reale. "
            "Commenta INFO o AGENDA e ti mando la demo NeatX. "
            "#NeatX #statistiche #analytics #dati #business"
        )
    elif feature == "multi_staff":
        script_text = (
            f"Se sei tra i {target.lower()} e gestire piu collaboratori e un caos, "
            f"stai perdendo clienti e soldi. Il problema e' {pain}. "
            f"Con NeatX puoi avere {promise}, ogni staff con la propria agenda. "
            "Vuoi saperne di piu? Commenta INFO qui sotto e ti invio tutto in privato!"
        )
        caption = (
            f"{target}: gestione staff e turni automatici. "
            "Commenta INFO o AGENDA e ti mando la demo NeatX. "
            "#NeatX #staff #turni #team #gestione"
        )
    else:
        script_text = (
            f"Se sei tra i {target.lower()} e stai ancora gestendo appuntamenti su WhatsApp, "
            f"stai perdendo tempo e soldi. Il problema e' {pain}. "
            f"Con NeatX puoi avere {promise}, senza rincorrere clienti tutto il giorno. "
            "Vuoi saperne di piu? Commenta INFO qui sotto e ti invio tutto in privato!"
        )
        caption = (
            f"{target}: basta agenda gestita a mano. "
            "Commenta INFO o AGENDA e ti mando la demo NeatX. "
            "#perte #fyp #foryou #viral #imprenditore #businessitalia #crescita"
        )

    return {
        "niche": target,
        "script_text": script_text,
        "hook_text": cover_title,
        "cover_title": cover_title,
        "image_prompt": image_prompt,
        "gameplay_style": gameplay_style,
        "caption": caption,
        "strategy_date": strategy.get("date"),
        "strategy_feature": feature,
        "strategy_pain": pain,
        "strategy_promise": promise,
        "fallback_reason": reason,
    }

def generate_daily_content():
    strategy = load_today_brief()
    target = strategy.get("niche") or random.choice(TARGET_AUDIENCES)
    gameplay_style = strategy.get("gameplay_style") or random.choice(GAMEPLAY_STYLES)
    if gameplay_style not in GAMEPLAY_STYLES:
        gameplay_style = random.choice(GAMEPLAY_STYLES)
    print(f"[*] Target di oggi selezionato: {target}")
    print(f"[*] Gameplay di oggi selezionato: {gameplay_style}")

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

    if not strategy.get("feature"):
        strategy["feature"] = random.choice(FEATURE_LIST)

    strategy_context = ""
    pain_focus = ""
    if strategy:
        feature_label = FEATURE_LABELS.get(strategy.get("feature", ""), strategy.get("feature_label", ""))
        strategy_context = f"""
[STRATEGIA DEL GIORNO]
Target: {target}
Feature: {feature_label} ({strategy.get("feature", "")})
Dolore: {strategy.get("pain", "")}
Promessa: {strategy.get("promise", "")}
Titolo copertina suggerito: {strategy.get("cover_title", "")}
Prompt immagine suggerito: {strategy.get("image_prompt", "")}
Argomento blog collegato: {strategy.get("blog_topic", "")}
"""
        pain_focus = strategy.get("pain", "")

    feature = strategy.get("feature", "")
    hook_instructions_map = {
        "no_show": "Fai capire che stanno perdendo soldi con clienti che non si presentano. Parla di acconti obbligatori e no-show azzerati.",
        "booking": "Fai capire che stanno perdendo tempo a rispondere su WhatsApp o al telefono. Parla di prenotazioni automatiche 24/7.",
        "timesheet": "Fai capire che perdono ore a gestire turni su Excel. Parla di CSV pronto per il commercialista, ferie e permessi automatici.",
        "recensioni": "Fai capire che perdono recensioni Google preziose. Parla del sistema automatico che raccoglie 5 stelle da ogni cliente soddisfatto.",
        "promemoria": "Fai capire che i clienti dimenticano gli appuntamenti. Parla di promemoria WhatsApp automatici che riducono i no-show del 90%.",
        "analytics": "Fai capire che non sanno quanto guadagnano davvero. Parla di statistiche in tempo reale su incassi, performance e trend.",
        "multi_staff": "Fai capire che gestire piu collaboratori e un caos. Parla di agenda separata per ogni staff, turni e ferie automatici.",
        "messaggi": "Fai capire che comprano piani SMS costosi che non usano mai. Parla di crediti WhatsApp ricaricabili da 39€ per 500 messaggi.",
        "referral": "Fai capire che ogni cliente soddisfatto potrebbe portarne altri. Parla del link referral brandizzato che trasforma i clienti in venditori.",
    }
    hook_instruction = hook_instructions_map.get(feature, "Fai capire che stanno perdendo tempo e soldi con sistemi manuali. Parla di automazione con NeatX.")

    prompt = f"""
Sei un esperto di marketing virale su Instagram e TikTok (stile ADHD retention).
Stai promuovendo 'NeatX', un'app geniale per prenotazioni automatiche online.

Scrivi un copione mirato per: {target}.
Il tema "{target}" deve guidare TUTTO: copione, hook, titolo, caption, immagine e promessa.
Non citare o descrivere altre professioni.
Lo sfondo superiore sara un gameplay stile "{gameplay_style}", quindi il testo deve restare leggibile e veloce.

{history_context}
{strategy_context}
Regole:
- Il video dura circa 20-30 secondi.
- Usa uno stile diretto, provocatorio ma professionale. {hook_instruction}
- Alla fine del video (ultimi 3-5 secondi) DEVI dire chiaramente una Call to Action per il nostro prodotto digitale, del tipo: "Prova gratis la nostra Agenda su neatx.store" oppure "Non perdere più appuntamenti, provala su neatx.store!". (Non dire più di commentare AGENDA).
- Il copione deve essere breve (circa 20-30 secondi parlati), super naturale e NON sembrare un robot che legge. Usa un tono energico e informale. NIENTE EMOJI NEL COPIONE PARLATO. LE EMOJI SONO SEVERAMENTE VIETATE IN script_text.
- L'hook del copione deve toccare un punto di dolore ESTREMO del target. Sii aggressivo, fagli capire che stanno buttando soldi e tempo.
- La scritta a schermo (hook_text) DEVE ESSERE IDENTICA a cover_title. Saranno le 3-4 parole enormi che appaiono in faccia all'utente.
- La caption di Instagram deve essere persuasiva, includere hashtag VIRALI come #perte #fyp #foryou #viral #imprenditore #businessitalia + hashtag di nicchia, e DEVE concludersi SEMPRE (all'ultimissima riga) con questo esatto testo: "👉 Prova gratis NeatX e riempi il tuo salone in automatico: link in Bio!"
- Il "cover_title" deve essere MASSIMO 4 PAROLE, enorme e scioccante.
- Il "image_prompt" deve essere in INGLESE e descrivere una SCENA CINEMATOGRAFICA REALISTICA che ILLUSTRA VISUALMENTE IL SENSO DEL VIDEO (il dolore/pain o la soluzione/promise descritti nel copione e nella strategia), NON solo l'ambiente generico della professione. La scena deve far capire a colpo d'occhio di cosa parla il reel, includendo il professionista {target} e un elemento visivo che rappresenti pain o promise. Mantieni riferimento a pain e promise già presenti in [STRATEGIA DEL GIORNO].
- Scrivi sempre "24 ore su 24", mai "24/7" o "247".

Formatta la risposta ESATTAMENTE come questo JSON (senza markdown, senza backtick):
{{
  "niche": "{target}",
  "script_text": "il copione letto dalla voce, aggressivo e dritto al punto",
  "hook_text": "DEVE ESSERE IDENTICO AL COVER_TITLE",
  "cover_title": "TITOLO SHOCK MAX 4 PAROLE",
  "image_prompt": "prompt fotografico che ritrae la scena specifica del dolore/soluzione del video",
  "gameplay_style": "{gameplay_style}",
  "caption": "la descrizione per instagram con hashtag"
}}
"""

    data = None
    openai_data = openai_json(prompt, max_tokens=1800)
    if isinstance(openai_data, dict):
        print("[+] Copione reel generato con OpenAI.")
        data = openai_data
    elif not GEMINI_API_KEY:
        data = build_fallback_content(target, gameplay_style, strategy, "OPENAI_API_KEY/GEMINI_API_KEY mancanti o non disponibili")
    else:
        try:
            client = genai.Client(api_key=GEMINI_API_KEY)
            print("[*] Contattando il cervello di Google Gemini 2.5 Flash...")
            response = client.models.generate_content(model="gemini-3.5-flash", contents=prompt)
            content = response.text.strip()
            data = json.loads(content)
        except Exception as e:
            data = build_fallback_content(target, gameplay_style, strategy, f"Gemini non disponibile: {e}")

    data["niche"] = target
    data["gameplay_style"] = data.get("gameplay_style") or gameplay_style
    if data["gameplay_style"] not in GAMEPLAY_STYLES:
        data["gameplay_style"] = gameplay_style
    if not data.get("image_prompt"):
        data["image_prompt"] = strategy.get("image_prompt") or build_scene_prompt(target, strategy.get("feature", ""))
    if strategy.get("cover_title") and not data.get("cover_title"):
        data["cover_title"] = strategy["cover_title"]
    if data.get("cover_title"):
        data["hook_text"] = data["cover_title"]
    if strategy:
        data["strategy_date"] = strategy.get("date")
        data["strategy_feature"] = strategy.get("feature")
        data["strategy_pain"] = strategy.get("pain")
        data["strategy_promise"] = strategy.get("promise")
    
    # Rimuovi forzatamente eventuali emoji dal testo parlato per evitare che l'audio le pronunci
    data["script_text"] = re.sub(r'[^\w\s,.\'!?àèìòùÀÈÌÒÙ-]', '', data["script_text"])
    
    # Salva il dato su file così gli altri script possono leggerlo
    with open("reel_data.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

    source = "fallback locale" if data.get("fallback_reason") else data.get("ai_provider", "AI")
    if not data.get("fallback_reason") and openai_data is data:
        source = "OpenAI"
    elif not data.get("fallback_reason") and openai_data is None:
        source = "Gemini"
    print(f"[+] Copione e testi creati con successo da {source} e salvati in reel_data.json!")
    return data

def download_pexels_video(query):
    if not PEXELS_API_KEY:
        print("[!] PEXELS_API_KEY mancante. Salto il download Pexels e uso il fallback video se disponibile.")
        return False

    print(f"[*] Ricerca video Pexels per la query: '{query}'...")
    url = f"https://api.pexels.com/videos/search?query={query}&orientation=portrait&size=medium&per_page=15"
    headers = {"Authorization": PEXELS_API_KEY}
    
    try:
        response = requests.get(url, headers=headers, timeout=(10, 60))
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
            
            r = requests.get(video_link, stream=True, timeout=(10, 300))
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
    
    # 2. Monta il video usando il nuovo motore professionale
    print("\n[*] Esecuzione neatx_reel_engine.py...")
    subprocess.run(["python", "-X", "utf8", "neatx_reel_engine.py"], check=True)
    
    # 4. Pubblica
    print("\n[*] Esecuzione publish_reel.py...")
    subprocess.run(["python", "publish_reel.py"], check=True)
    
    print("\n[+] CICLO COMPLETATO! IL REEL E' ONLINE!")

if __name__ == "__main__":
    run_pipeline()
