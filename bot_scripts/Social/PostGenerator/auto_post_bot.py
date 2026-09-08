import os
import json
import time
import requests
import random
import base64
import re
import sys
from pathlib import Path
from dotenv import load_dotenv

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("playwright non installato.")
    exit(1)

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent.parent
THEME_FILE = PROJECT_ROOT / "bot_scripts" / "Content" / "daily_theme.json"
sys.path.insert(0, str(PROJECT_ROOT))

# Load env variables (if testing locally)
ENV_FILE = PROJECT_ROOT / "bot_scripts" / "Social" / "ReelGenerator" / ".env"
load_dotenv(ENV_FILE)

META_ACCESS_TOKEN = os.getenv("META_ACCESS_TOKEN")
IG_ACCOUNT_ID = os.getenv("IG_ACCOUNT_ID")
PEXELS_API_KEY = os.getenv("PEXELS_API_KEY")
from bot_scripts.Automation.ai_provider import openai_text
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_REPOSITORY = os.getenv("GITHUB_REPOSITORY", "lore-bisceglie/DemoNeatXApp")

missing = []
if not META_ACCESS_TOKEN: missing.append("META_ACCESS_TOKEN")
if not IG_ACCOUNT_ID: missing.append("IG_ACCOUNT_ID")
if not PEXELS_API_KEY: missing.append("PEXELS_API_KEY")
if not OPENAI_API_KEY: missing.append("OPENAI_API_KEY")

if missing:
    print(f"ERRORE: Variabili d'ambiente mancanti: {', '.join(missing)}")
    exit(1)


def load_theme():
    if not THEME_FILE.exists():
        return {
            "main_topic": "L'importanza della digitalizzazione",
            "angle": "Come NeatX aiuta a risparmiare tempo e gestire il salone in automatico.",
            "keywords": ["barbiere", "gestionale", "neatx"],
            "hashtags": ["#barbiere", "#gestionale", "#neatx"]
        }
    with open(THEME_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def get_pexels_image(query=None):
    # Ampliamo il target a tutta la categoria beauty/wellness
    target_queries = [
        "beauty salon", "hair salon", "barbershop", 
        "spa", "nail salon", "wellness center", 
        "hairdresser", "makeup artist",
        "massage therapy", "skincare routine", "haircut men",
        "salon interior", "relaxing spa", "facial treatment",
        "shaving", "hairstylist", "beauty products", "wellness retreat"
    ]
    
    # Se la query passata è generica o manca, ne scegliamo una a caso
    if not query or query in ["barbershop", "beauty salon", "hair salon"]:
        query = random.choice(target_queries)
        
    print(f"Cercando immagine su Pexels per query: {query}")
    
    # Randomizziamo la pagina (1-15) per non avere mai le stesse 15 foto
    page_num = random.randint(1, 15)
    url = f"https://api.pexels.com/v1/search?query={query}&per_page=15&page={page_num}&orientation=portrait"
    headers = {"Authorization": PEXELS_API_KEY}
    
    resp = requests.get(url, headers=headers)
    if resp.status_code == 200:
        data = resp.json()
        if data.get("photos"):
            photo = random.choice(data["photos"])
            image_url = photo["src"]["large2x"]
            return image_url
            
    # Fallback image generica se fallisce
    return "https://images.pexels.com/photos/3993444/pexels-photo-3993444.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"

def generate_caption(theme, industry_query):
    topic = theme.get('main_topic', 'Gestione Salone')
    angle = theme.get('angle', 'Innovazione')
    
    # Adattiamo l'hashtag in base alla categoria trovata per Pexels
    industry_hashtags = "#NeatX #GestioneSalone"
    if "barber" in industry_query:
        industry_hashtags += " #BarberShop #Barbiere"
    elif "beauty" in industry_query or "nail" in industry_query or "makeup" in industry_query:
        industry_hashtags += " #CentroEstetico #Estetica #BeautySalon"
    elif "hair" in industry_query:
        industry_hashtags += " #Parrucchiere #HairSalon #Hairdresser"
    elif "spa" in industry_query or "wellness" in industry_query:
        industry_hashtags += " #CentroBenessere #Spa #Wellness"
        
    prompt = f"""Scrivi una caption avvincente per un post Instagram (massimo 150 parole).
Il brand è NeatX (il gestionale all-in-one per Saloni di Bellezza, Parrucchieri, Centri Benessere, SPA, ed Estetiste).
Evita di parlare solo di barbieri, mantieni il testo adatto a tutta l'industria del beauty e wellness.
Tema del giorno: {topic}
Angolazione: {angle}
Hashtag da usare: {industry_hashtags}
Finisci con una call to action: Clicca il link in bio per provare NeatX."""

    try:
        caption = openai_text(prompt, model="gpt-4o-mini", max_tokens=300).strip()
        return re.sub(r"^(ecco (una )?(bozza|proposta di caption)\s*:?[ \t]*)", "", caption, flags=re.I)
    except Exception as e:
        print(f"Errore OpenAI durante la generazione della caption: {e}")
                
    # Fallback locale per non bloccare la pubblicazione se l'AI non risponde.
    return f"Semplifica la gestione del tuo Salone con NeatX. Meno tempo speso al telefono, più tempo per i tuoi clienti.\n\nClicca il link in bio per provare NeatX! {industry_hashtags}"

def create_graphic_post(title, bg_url):
    print("Creazione grafica con Playwright (4:5 1080x1350)...")
    output_path = SCRIPT_DIR / "temp_post.png"
    html_path = SCRIPT_DIR / "temp_post.html"
    
    background_css = f"url('{bg_url}') center center / cover no-repeat"
    
    html_content = f"""
    <!doctype html>
    <html lang="it">
    <head>
      <meta charset="utf-8">
      <style>
        * {{ box-sizing: border-box; margin: 0; padding: 0; }}
        html, body {{ width: 1080px; height: 1350px; overflow: hidden; font-family: "Segoe UI", Arial, sans-serif; }}
        .background {{ position: absolute; inset: 0; background: {background_css}; }}
        .banner {{
          position: absolute; bottom: 0; left: 0; right: 0; height: 200px;
          background: linear-gradient(0deg, rgba(11,18,33,1) 0%, rgba(11,18,33,1) 80%, rgba(11,18,33,0) 100%);
          display: flex; justify-content: space-between; align-items: flex-end; padding: 0 60px 40px 60px;
        }}
        .logo {{
          font-size: 80px; font-weight: 400; color: #ffffff; letter-spacing: -2px; margin-bottom: -15px;
        }}
        .logo strong {{ color: #11bff5; font-weight: 500; }}
        .text-container {{
          text-align: right; display: flex; flex-direction: column; justify-content: flex-end;
        }}
        .text-line1 {{ font-size: 30px; font-weight: 500; color: #ffffff; margin-bottom: 5px; }}
        .text-line2 {{ font-size: 26px; font-weight: 600; color: #7dd3fc; }}
      </style>
    </head>
    <body>
      <div class="background"></div>
      <div class="banner">
        <div class="logo">Neat<strong>X</strong></div>
        <div class="text-container">
          <div class="text-line1">Il gestionale per il tuo Salone</div>
          <div class="text-line2">Prova gratis su neatx.store</div>
        </div>
      </div>
    </body>
    </html>
    """
    
    html_path.write_text(html_content, encoding="utf-8")
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 1080, "height": 1350})
            page.goto(html_path.as_uri())
            page.wait_for_timeout(1000)
            page.screenshot(path=str(output_path))
            browser.close()
    finally:
        html_path.unlink(missing_ok=True)
        
    return output_path

def upload_to_temp_server(file_path):
    print("Caricamento immagine sul server temporaneo...")
    url = "https://tmpfiles.org/api/v1/upload"
    with open(file_path, "rb") as f:
        resp = requests.post(url, files={"file": f}, timeout=60)
    
    data = resp.json()
    if "data" in data and "url" in data["data"]:
        # tmpfiles.org URL needs to be converted from /f/ to /dl/ to get direct image
        public_url = data["data"]["url"].replace("tmpfiles.org/", "tmpfiles.org/dl/")
        print(f"Immagine hostata temporaneamente su: {public_url}")
        return public_url
    else:
        print(f"Errore caricamento temp: {resp.text}")
        return None

def upload_to_github_public_url(file_path):
    """Publish the generated PNG at a stable public URL for Meta."""
    if not GITHUB_TOKEN or not os.getenv("GITHUB_ACTIONS"):
        return None
    path = "bot_scripts/Social/PostGenerator/runtime-post.png"
    api_url = f"https://api.github.com/repos/{GITHUB_REPOSITORY}/contents/{path}"
    headers = {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    try:
        existing = requests.get(api_url, headers=headers, params={"ref": "main"}, timeout=30)
        payload = {
            "message": "Auto-post: aggiorna immagine pubblica",
            "content": base64.b64encode(file_path.read_bytes()).decode("ascii"),
            "branch": "main",
        }
        if existing.status_code == 200:
            payload["sha"] = existing.json().get("sha")
        uploaded = requests.put(api_url, headers=headers, json=payload, timeout=60)
        if uploaded.status_code in (200, 201):
            return uploaded.json().get("content", {}).get("download_url")
        print(f"Upload GitHub non riuscito ({uploaded.status_code}): {uploaded.text[:300]}")
    except (OSError, requests.RequestException, ValueError) as exc:
        print(f"Upload GitHub non riuscito: {exc}")
    return None

def publish_to_instagram(image_url, caption):
    print("Inizio procedura di pubblicazione su Instagram...")
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
    time.sleep(15)
    
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

def publish_story_to_instagram(image_url):
    print("Inizio procedura di pubblicazione STORIA su Instagram...")
    url_media = f"https://graph.facebook.com/v21.0/{IG_ACCOUNT_ID}/media"
    payload = {
        "image_url": image_url,
        "media_type": "STORIES",
        "access_token": META_ACCESS_TOKEN
    }
    resp = requests.post(url_media, data=payload)
    data = resp.json()
    if "id" not in data:
        print(f"ERRORE Creazione Container Storia: {data}")
        return False
        
    container_id = data["id"]
    print(f"Container ID Storia creato: {container_id}")
    time.sleep(15)
    
    url_publish = f"https://graph.facebook.com/v21.0/{IG_ACCOUNT_ID}/media_publish"
    pub_payload = {
        "creation_id": container_id,
        "access_token": META_ACCESS_TOKEN
    }
    pub_resp = requests.post(url_publish, data=pub_payload)
    pub_data = pub_resp.json()
    
    if "id" in pub_data:
        print(f"SUCCESSO! Storia pubblicata. ID: {pub_data['id']}")
        return True
    else:
        print(f"ERRORE Pubblicazione Storia: {pub_data}")
        return False

def main():
    print("=== Avvio Auto-Post Bot per Instagram ===")
    theme = load_theme()
    
    keywords = theme.get("keywords", [])
    search_query = "barbershop"
    if "estetista" in keywords or "beauty" in keywords:
        search_query = "beauty salon"
    elif "haircut" in keywords or "parrucchiere" in keywords:
        search_query = "hair salon"
        
    bg_url = get_pexels_image(search_query)
    caption = generate_caption(theme, search_query)
    
    # Genera la grafica con Playwright
    title = theme.get("main_topic", "L'Innovazione nel Salone")
    img_path = create_graphic_post(title, bg_url)
    
    # In Actions usa esclusivamente un URL GitHub stabile: tmpfiles può
    # restituire una pagina HTML che Meta interpreta come immagine non valida.
    public_url = upload_to_github_public_url(img_path)
    if not public_url and not os.getenv("GITHUB_ACTIONS"):
        public_url = upload_to_temp_server(img_path)
    if not public_url:
        print("Errore: impossibile pubblicare l'immagine su un URL stabile.")
    
    if public_url:
        success = publish_to_instagram(public_url, caption)
        if success:
            time.sleep(5)
            publish_story_to_instagram(public_url)
        else:
            import sys
            print("Errore: Pubblicazione su Instagram fallita.")
            sys.exit(1)
    else:
        import sys
        print("Errore: Impossibile completare il caricamento.")
        sys.exit(1)
        
    print("=== Auto-Post Bot terminato ===")

if __name__ == "__main__":
    main()
