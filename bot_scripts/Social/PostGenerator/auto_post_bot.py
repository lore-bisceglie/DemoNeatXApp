import os
import json
import time
import requests
import random
from pathlib import Path
from dotenv import load_dotenv

try:
    from google import genai
except ImportError:
    print("google-genai non installato. pip install google-genai")
    exit(1)

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent.parent
THEME_FILE = PROJECT_ROOT / "bot_scripts" / "Content" / "daily_theme.json"

# Load env variables (if testing locally)
ENV_FILE = PROJECT_ROOT / "bot_scripts" / "Social" / "ReelGenerator" / ".env"
load_dotenv(ENV_FILE)

META_ACCESS_TOKEN = os.getenv("META_ACCESS_TOKEN")
IG_ACCOUNT_ID = os.getenv("IG_ACCOUNT_ID")
PEXELS_API_KEY = os.getenv("PEXELS_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

missing = []
if not META_ACCESS_TOKEN: missing.append("META_ACCESS_TOKEN")
if not IG_ACCOUNT_ID: missing.append("IG_ACCOUNT_ID")
if not PEXELS_API_KEY: missing.append("PEXELS_API_KEY")
if not GEMINI_API_KEY: missing.append("GEMINI_API_KEY")

if missing:
    print(f"ERRORE: Variabili d'ambiente mancanti: {', '.join(missing)}")
    exit(1)

client = genai.Client(api_key=GEMINI_API_KEY)

def load_theme():
    if not THEME_FILE.exists():
        print(f"ERRORE: {THEME_FILE} non trovato. Fallback a tema generico.")
        return {
            "main_topic": "L'importanza della digitalizzazione",
            "angle": "Come NeatX aiuta a risparmiare tempo e gestire il salone in automatico.",
            "keywords": ["barbiere", "gestionale", "neatx", "appuntamenti", "salone"],
            "hashtags": ["#barbiere", "#gestionale", "#neatx", "#innovazione"]
        }
    with open(THEME_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def get_pexels_image(query="barbershop"):
    print(f"Cercando immagine su Pexels per query: {query}")
    url = f"https://api.pexels.com/v1/search?query={query}&per_page=15&orientation=portrait"
    headers = {"Authorization": PEXELS_API_KEY}
    resp = requests.get(url, headers=headers)
    if resp.status_code == 200:
        data = resp.json()
        if data.get("photos"):
            # Scegli una foto casuale per variare
            photo = random.choice(data["photos"])
            image_url = photo["src"]["large2x"]
            print(f"Immagine trovata: {image_url}")
            return image_url
    print("Errore Pexels o nessuna foto trovata, uso fallback.")
    # Fallback image (NeatX related or generic)
    return "https://images.pexels.com/photos/1319460/pexels-photo-1319460.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"

def generate_caption(theme):
    print("Generazione caption tramite Gemini...")
    topic = theme.get('main_topic', 'Gestione Salone')
    angle = theme.get('angle', 'Innovazione')
    hashtags = " ".join(theme.get('hashtags', ['#NeatX', '#Barbiere']))
    
    prompt = f"""Scrivi una caption avvincente per un post Instagram (massimo 150-200 parole).
Il brand è NeatX (un'app/SaaS gestionale per barbieri, estetiste e saloni).
Tema del giorno: {topic}
Angolazione: {angle}
Hashtag da usare: {hashtags}

Scrivi direttamente il testo della caption. Includi emoji. Cerca di essere professionale, motivante ma conciso. Finisci con una call to action (es: Clicca il link in bio per provare NeatX)."""

    response = client.models.generate_content(model="gemini-3.5-flash", contents=prompt)
    caption = response.text.strip()
    return caption

def publish_to_instagram(image_url, caption):
    print("Inizio procedura di pubblicazione su Instagram...")
    # Step 1: Create Container (IMAGE post)
    url_media = f"https://graph.facebook.com/v21.0/{IG_ACCOUNT_ID}/media"
    payload = {
        "image_url": image_url,
        "caption": caption,
        "access_token": META_ACCESS_TOKEN
    }
    resp = requests.post(url_media, data=payload)
    data = resp.json()
    if "id" not in data:
        print(f"ERRORE Creazione Container: {data}")
        return False
        
    container_id = data["id"]
    print(f"Container ID creato: {container_id}")
    
    # Step 2: Publish Container
    # Wait a few seconds for Facebook to process the image URL
    time.sleep(10)
    
    url_publish = f"https://graph.facebook.com/v21.0/{IG_ACCOUNT_ID}/media_publish"
    pub_payload = {
        "creation_id": container_id,
        "access_token": META_ACCESS_TOKEN
    }
    pub_resp = requests.post(url_publish, data=pub_payload)
    pub_data = pub_resp.json()
    
    if "id" in pub_data:
        print(f"SUCCESSO! Post pubblicato. ID Post: {pub_data['id']}")
        return True
    else:
        print(f"ERRORE Pubblicazione: {pub_data}")
        return False

def main():
    print("=== Avvio Auto-Post Bot per Instagram ===")
    theme = load_theme()
    
    # Scegliamo una keyword basata sul tema o sul settore
    keywords = theme.get("keywords", [])
    search_query = "barbershop"
    if "estetista" in keywords or "beauty" in keywords:
        search_query = "beauty salon"
    elif "haircut" in keywords or "parrucchiere" in keywords:
        search_query = "hair salon"
        
    image_url = get_pexels_image(search_query)
    caption = generate_caption(theme)
    
    print("\n--- CAPTION ANTEPRIMA ---")
    print(caption)
    print("-------------------------\n")
    
    publish_to_instagram(image_url, caption)
    print("=== Auto-Post Bot terminato ===")

if __name__ == "__main__":
    main()
