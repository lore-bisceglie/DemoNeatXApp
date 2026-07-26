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
    print("google-genai non installato.")
    exit(1)

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("playwright non installato.")
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
        return {
            "main_topic": "L'importanza della digitalizzazione",
            "angle": "Come NeatX aiuta a risparmiare tempo e gestire il salone in automatico.",
            "keywords": ["barbiere", "gestionale", "neatx"],
            "hashtags": ["#barbiere", "#gestionale", "#neatx"]
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
            photo = random.choice(data["photos"])
            image_url = photo["src"]["large2x"]
            return image_url
    return "https://images.pexels.com/photos/1319460/pexels-photo-1319460.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"

def generate_caption(theme):
    topic = theme.get('main_topic', 'Gestione Salone')
    angle = theme.get('angle', 'Innovazione')
    hashtags = " ".join(theme.get('hashtags', ['#NeatX', '#Barbiere']))
    
    prompt = f"""Scrivi una caption avvincente per un post Instagram (massimo 150 parole).
Il brand è NeatX (un'app gestionale per barbieri, estetiste e saloni).
Tema del giorno: {topic}
Angolazione: {angle}
Hashtag da usare: {hashtags}
Finisci con una call to action: Clicca il link in bio per provare NeatX."""

    response = client.models.generate_content(model="gemini-3.5-flash", contents=prompt)
    return response.text.strip()

def create_graphic_post(title, bg_url):
    print("Creazione grafica con Playwright (4:5 1080x1350)...")
    output_path = SCRIPT_DIR / "temp_post.png"
    html_path = SCRIPT_DIR / "temp_post.html"
    
    background_css = f"url('{bg_url}') center center / cover no-repeat"
    title_html = title.replace(" ", "<br>") if len(title) < 20 else title
    
    html_content = f"""
    <!doctype html>
    <html lang="it">
    <head>
      <meta charset="utf-8">
      <style>
        * {{ box-sizing: border-box; margin: 0; padding: 0; }}
        html, body {{ width: 1080px; height: 1350px; overflow: hidden; }}
        body {{ font-family: "Segoe UI", Arial, sans-serif; color: #fff; background: #020617; }}
        .background {{ position: absolute; inset: 0; background: {background_css}; transform: scale(1.025); }}
        .scrim {{
          position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(2, 6, 23, .1) 0%, rgba(2, 6, 23, .4) 60%, rgba(2, 6, 23, .95) 100%);
        }}
        .brand {{
          position: absolute; top: 60px; left: 50%; transform: translateX(-50%);
          font-size: 70px; font-weight: 300; letter-spacing: -4px; text-shadow: 0 5px 20px rgba(0, 0, 0, .8);
        }}
        .brand strong {{ color: #11bff5; font-weight: 500; }}
        .title-card {{
          position: absolute; bottom: 120px; left: 80px; right: 80px;
          display: flex; flex-direction: column; justify-content: center; align-items: flex-start;
        }}
        .title {{
          font-size: 85px; line-height: 1.1; font-weight: 900; letter-spacing: -2px;
          text-transform: uppercase; text-shadow: 0 5px 25px rgba(0, 0, 0, .9);
        }}
        .accent {{
          width: 120px; height: 8px; margin-top: 30px; border-radius: 99px;
          background: linear-gradient(90deg, #22d3ee, #3b82f6);
        }}
        .site {{
          position: absolute; bottom: 50px; left: 50%; transform: translateX(-50%);
          color: #7dd3fc; font-size: 26px; font-weight: 800; letter-spacing: 4px;
        }}
      </style>
    </head>
    <body>
      <div class="background"></div>
      <div class="scrim"></div>
      <div class="brand">Neat<strong>X</strong></div>
      <div class="title-card">
        <div class="title">{title}</div>
        <div class="accent"></div>
      </div>
      <div class="site">NEATX.STORE</div>
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
    url = "https://litterbox.catbox.moe/resources/internals/api.php"
    with open(file_path, "rb") as f:
        resp = requests.post(url, data={"reqtype": "fileupload", "time": "12h"}, files={"fileToUpload": f}, timeout=60)
    
    public_url = resp.text.strip()
    if not public_url.startswith("http"):
        print(f"Errore caricamento temp: {public_url}")
        return None
    print(f"Immagine hostata temporaneamente su: {public_url}")
    return public_url

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
    caption = generate_caption(theme)
    
    # Genera la grafica con Playwright
    title = theme.get("main_topic", "L'Innovazione nel Salone")
    img_path = create_graphic_post(title, bg_url)
    
    # Upload su host temporaneo
    public_url = upload_to_temp_server(img_path)
    
    if public_url:
        publish_to_instagram(public_url, caption)
        
    print("=== Auto-Post Bot terminato ===")

if __name__ == "__main__":
    main()
