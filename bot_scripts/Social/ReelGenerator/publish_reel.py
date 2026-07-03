import os
import time
import requests
import threading
from http.server import SimpleHTTPRequestHandler, HTTPServer
from pyngrok import ngrok
import json

# ==========================================
# CONFIGURAZIONE
# ==========================================
if os.environ.get("GITHUB_ACTIONS"):
    META_ACCESS_TOKEN = os.environ.get("META_ACCESS_TOKEN")
    IG_ACCOUNT_ID = os.environ.get("IG_ACCOUNT_ID")
else:
    META_ACCESS_TOKEN = "EAAW9SXB1ygABRZBS15ZBOZCoZBwRudvZBPkfxKXtl374Kx3ZCA3ubLvH4RO4kf925bmIp3Tkr2LSxbJOymyiE3GzXwz0qFAIdZCpihNcE5nzRpBPnUhKuaKxEgs4RKTkJPUlcU4H67C1zaiOsOu3h400mHfePIYbgeydhIkJHbhzBUgjGGVlrBFK8n3hR3AWhkbrgZDZD"
    IG_ACCOUNT_ID = "17841413414572750" # Il tuo ID Account Instagram
    
TIKTOK_SESSION_ID = "b97e92f95372e1d89e4f68531ece9b9f" # Session ID per TikTok
VIDEO_FILE = "reel_splitscreen_subbed.mp4"
# ==========================================

def get_caption():
    if os.path.exists("reel_data.json"):
        with open("reel_data.json", "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("caption", "Scopri come automatizzare il tuo business con NeatX! 🚀 #NeatX #Business #Automazione")
    return "Scopri come automatizzare il tuo business con NeatX! 🚀 #NeatX #Business #Automazione"

def start_server(port):
    handler = SimpleHTTPRequestHandler
    httpd = HTTPServer(("", port), handler)
    httpd.serve_forever()

def publish_to_instagram():
    if META_ACCESS_TOKEN.startswith("EAxxxx"):
        print("[!] Errore: Inserisci il tuo META_ACCESS_TOKEN e IG_ACCOUNT_ID nel file publish_reel.py prima di eseguire!")
        return

    if not os.path.exists(VIDEO_FILE):
        print(f"[!] Errore: Il video {VIDEO_FILE} non esiste. Generalo prima con generate_reel.py")
        return

    caption = get_caption()
    
    # 1. Caricamento temporaneo del video (per permettere a Meta di scaricarlo)
    print(f"[*] Caricamento del video {VIDEO_FILE} su server temporaneo per Meta...")
    try:
        r_upload = requests.post("https://uguu.se/upload", files={"files[]": open(VIDEO_FILE, "rb")})
        video_url = r_upload.json()["files"][0]["url"]
        print(f"[+] URL temporaneo generato: {video_url}")
    except Exception as e:
        print("[!] Errore durante il caricamento temporaneo:", e)
        return
        
    # 2. Caricamento temporaneo della copertina
    cover_url = ""
    path_cover = "assets/cover.png"
    if os.path.exists(path_cover):
        print(f"[*] Caricamento della copertina {path_cover} su server temporaneo...")
        try:
            r_cover = requests.post("https://uguu.se/upload", files={"files[]": open(path_cover, "rb")})
            cover_url = r_cover.json()["files"][0]["url"]
            print(f"[+] URL copertina generato: {cover_url}")
        except Exception as e:
            print("[!] Errore durante il caricamento della copertina:", e)
    
    # 3. Creazione Container (Fase 1 Meta API)
    print("[*] Invio richiesta di caricamento a Instagram...")
    url_media = f"https://graph.facebook.com/v21.0/{IG_ACCOUNT_ID}/media"
    payload = {
        "media_type": "REELS",
        "video_url": video_url,
        "caption": caption,
        "access_token": META_ACCESS_TOKEN
    }
    if cover_url:
        payload["cover_url"] = cover_url
    
    r = requests.post(url_media, data=payload)
    if r.status_code != 200:
        print("[!] Errore creazione container:", r.json())
        return
        
    container_id = r.json().get("id")
    print(f"[+] Container creato con ID: {container_id}")
    
    # 4. Polling stato caricamento
    print("[*] Attesa che Meta elabori il video (ci vorrà un po')...")
    url_status = f"https://graph.facebook.com/v21.0/{container_id}?fields=status_code&access_token={META_ACCESS_TOKEN}"
    
    while True:
        status_req = requests.get(url_status)
        status = status_req.json().get("status_code", "UNKNOWN")
        print(f"    Stato: {status}")
        if status == "FINISHED":
            break
        elif status == "ERROR":
            print("[!] Errore durante l'elaborazione del video su Meta.")
            return
        time.sleep(5)
        
    # 5. Pubblicazione
    print("[*] Pubblicazione sul profilo Instagram...")
    url_publish = f"https://graph.facebook.com/v21.0/{IG_ACCOUNT_ID}/media_publish"
    pub_payload = {
        "creation_id": container_id,
        "access_token": META_ACCESS_TOKEN
    }
    
    r_pub = requests.post(url_publish, data=pub_payload)
    if r_pub.status_code == 200:
        print("[+] REEL PUBBLICATO CON SUCCESSO SU INSTAGRAM!")
        print("ID Post:", r_pub.json().get("id"))
    else:
        print("[!] Errore in fase di pubblicazione:", r_pub.json())

def publish_to_tiktok():
    if not TIKTOK_SESSION_ID:
        print("[!] Errore: TIKTOK_SESSION_ID mancante!")
        return
        
    if not os.path.exists(VIDEO_FILE):
        print(f"[!] Errore: Il video {VIDEO_FILE} non esiste.")
        return
        
    caption = get_caption()
    
    print("[*] Avvio pubblicazione su TikTok...")
    try:
        from tiktok_uploader.upload import upload_video
        upload_video(
            VIDEO_FILE,
            description=caption,
            cookies_list=[{"name": "sessionid", "value": TIKTOK_SESSION_ID, "domain": ".tiktok.com", "path": "/"}],
            browser="chromium", # Usa la versione locale invece di quella globale
            headless=False # Impostato a False per vedere se ci sono blocchi captcha la prima volta
        )
        print("[+] VIDEO PUBBLICATO CON SUCCESSO SU TIKTOK!")
    except Exception as e:
        print(f"[!] Errore durante la pubblicazione su TikTok: {e}")

def publish_to_youtube():
    if not os.path.exists(VIDEO_FILE):
        print(f"[!] Errore: Il video {VIDEO_FILE} non esiste.")
        return
        
    caption = get_caption()
    title = caption.split("#")[0][:60] # Prende la prima frase prima degli hashtag come titolo
    
    try:
        import youtube_uploader
        video_id = youtube_uploader.upload_short(VIDEO_FILE, title, caption)
        if video_id:
            print("[+] VIDEO INVIATO CON SUCCESSO A YOUTUBE SHORTS!")
            
            # --- AUTO APPRENDIMENTO: Salvataggio in history.json ---
            history_file = "history.json"
            history = []
            if os.path.exists(history_file):
                with open(history_file, "r", encoding="utf-8") as f:
                    try:
                        history = json.load(f)
                    except:
                        history = []
            
            # Leggi i metadati del video per sapere di cosa parla
            metadata = {}
            if os.path.exists("reel_data.json"):
                with open("reel_data.json", "r", encoding="utf-8") as f:
                    metadata = json.load(f)
            
            # Aggiungi il nuovo record
            new_record = {
                "youtube_id": video_id,
                "title": metadata.get("cover_title", title),
                "hook": metadata.get("hook_text", ""),
                "date": time.strftime("%Y-%m-%d"),
                "views": 0 # Saranno aggiornate in seguito dallo script di analisi
            }
            history.append(new_record)
            
            with open(history_file, "w", encoding="utf-8") as f:
                json.dump(history, f, indent=4)
                
            print(f"[*] Aggiunto {video_id} a history.json per auto-apprendimento.")
            
    except Exception as e:
        print(f"[!] Errore durante la pubblicazione su YouTube: {e}")

if __name__ == "__main__":
    print("=== INIZIO PUBBLICAZIONE MULTI-PIATTAFORMA ===")
    publish_to_instagram()
    print("----------------------------------------------")
    publish_to_tiktok()
    print("----------------------------------------------")
    publish_to_youtube()
    print("=== PUBBLICAZIONE COMPLETATA ===")
