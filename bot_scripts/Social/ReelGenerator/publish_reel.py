import os
import time
import requests
import json
import sys
from datetime import datetime
from dotenv import load_dotenv
from tiktok_cookies import load_tiktok_cookies

# ==========================================
# CONFIGURAZIONE
# ==========================================
load_dotenv()

META_ACCESS_TOKEN = os.environ.get("META_ACCESS_TOKEN")
IG_ACCOUNT_ID = os.environ.get("IG_ACCOUNT_ID")
TIKTOK_MAKE_WEBHOOK_URL = os.environ.get("TIKTOK_MAKE_WEBHOOK_URL")
VIDEO_FILE = "reel_splitscreen_subbed.mp4"
STRICT_PUBLISH = os.environ.get("STRICT_PUBLISH", "").lower() in ("1", "true", "yes", "y")
REPORT_FILE = os.environ.get("PUBLISH_REPORT_FILE", "publish_report.json")
# ==========================================

def platform_result(ok, message="", extra=None):
    result = {
        "ok": bool(ok),
        "message": message,
    }
    if extra:
        result.update(extra)
    return result

def write_report(results, preflight=None):
    report = {
        "created_at": datetime.now().isoformat(timespec="seconds"),
        "strict_publish": STRICT_PUBLISH,
        "video_file": VIDEO_FILE,
        "preflight": preflight or {},
        "results": results,
    }
    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print(f"[*] Report pubblicazione salvato in {REPORT_FILE}")

def has_youtube_auth():
    return bool(os.environ.get("YOUTUBE_TOKEN_JSON")) or os.path.exists("token.json")

def run_preflight():
    checks = {
        "video_file": platform_result(os.path.exists(VIDEO_FILE), f"File video richiesto: {VIDEO_FILE}"),
        "instagram": platform_result(
            bool(META_ACCESS_TOKEN and IG_ACCOUNT_ID and not META_ACCESS_TOKEN.startswith("EAxxxx")),
            "Richiede META_ACCESS_TOKEN valido e IG_ACCOUNT_ID.",
        ),
        "tiktok": platform_result(
            bool(TIKTOK_MAKE_WEBHOOK_URL),
            "Richiede TIKTOK_MAKE_WEBHOOK_URL valido configurato nel file .env",
        ),
        "youtube": platform_result(
            has_youtube_auth(),
            "Richiede YOUTUBE_TOKEN_JSON o token.json locale valido.",
        ),
    }

    failed = [name for name, result in checks.items() if not result["ok"]]
    if failed:
        print("[!] Preflight pubblicazione: problemi trovati.")
        for name in failed:
            print(f"    - {name}: {checks[name]['message']}")
    else:
        print("[+] Preflight pubblicazione: tutto pronto.")

    return checks, failed

def get_caption():
    if os.path.exists("reel_data.json"):
        with open("reel_data.json", "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("caption", "Scopri come automatizzare il tuo business con NeatX! 🚀 #NeatX #Business #Automazione")
    return "Scopri come automatizzare il tuo business con NeatX! 🚀 #NeatX #Business #Automazione"

def publish_to_instagram():
    if not META_ACCESS_TOKEN or not IG_ACCOUNT_ID:
        message = "META_ACCESS_TOKEN o IG_ACCOUNT_ID mancanti."
        print(f"[!] Errore: {message} Impostali nei GitHub Secrets o nel file .env locale.")
        return platform_result(False, message)

    if META_ACCESS_TOKEN.startswith("EAxxxx"):
        message = "META_ACCESS_TOKEN non valido."
        print(f"[!] Errore: {message}")
        return platform_result(False, message)

    if not os.path.exists(VIDEO_FILE):
        message = f"Il video {VIDEO_FILE} non esiste."
        print(f"[!] Errore: {message} Generalo prima con generate_reel.py")
        return platform_result(False, message)

    caption = get_caption()
    
    # 1. Caricamento temporaneo del video (per permettere a Meta di scaricarlo)
    print(f"[*] Caricamento del video {VIDEO_FILE} su server temporaneo per Meta...")
    try:
        r_upload = requests.post(
            "https://litterbox.catbox.moe/resources/internals/api.php", 
            data={"reqtype": "fileupload", "time": "1h"}, 
            files={"fileToUpload": open(VIDEO_FILE, "rb")}
        )
        video_url = r_upload.text.strip()
        print(f"[+] URL temporaneo generato: {video_url}")
        
        if not video_url.startswith("http"):
            raise Exception(f"Risposta non valida dal server temporaneo: {video_url}")
            
    except Exception as e:
        message = f"Errore durante il caricamento temporaneo: {e}"
        print("[!]", message)
        return platform_result(False, message)
        
    # 2. Caricamento temporaneo della copertina
    cover_url = ""
    path_cover = "assets/cover.png"
    if os.path.exists(path_cover):
        print(f"[*] Caricamento della copertina {path_cover} su server temporaneo...")
        try:
            r_cover = requests.post(
                "https://litterbox.catbox.moe/resources/internals/api.php", 
                data={"reqtype": "fileupload", "time": "1h"}, 
                files={"fileToUpload": open(path_cover, "rb")}
            )
            cover_url = r_cover.text.strip()
            print(f"[+] URL copertina generato: {cover_url}")
            
            if not cover_url.startswith("http"):
                print(f"[!] Avviso: Risposta copertina non valida: {cover_url}")
                cover_url = ""
                
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
        message = f"Errore creazione container: {r.text}"
        print("[!]", message)
        return platform_result(False, message)
        
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
            message = "Errore durante l'elaborazione del video su Meta."
            print("[!]", message)
            return platform_result(False, message, {"container_id": container_id})
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
        post_id = r_pub.json().get("id")
        print("[+] REEL PUBBLICATO CON SUCCESSO SU INSTAGRAM!")
        print("ID Post:", post_id)
        return platform_result(True, "Pubblicato su Instagram.", {"post_id": post_id})
    else:
        message = f"Errore in fase di pubblicazione: {r_pub.text}"
        print("[!]", message)
        return platform_result(False, message)

def publish_to_tiktok():
    if not TIKTOK_MAKE_WEBHOOK_URL:
        message = "TIKTOK_MAKE_WEBHOOK_URL mancante. Crea un webhook su Make.com e mettilo nel .env"
        print(f"[!] Errore: {message}")
        return platform_result(False, message)
        
    if not os.path.exists(VIDEO_FILE):
        message = f"Il video {VIDEO_FILE} non esiste."
        print(f"[!] Errore: {message}")
        return platform_result(False, message)
        
    caption = get_caption()
    
    print("[*] Avvio invio a Make.com (Ponte Ufficiale TikTok)...")
    try:
        with open(VIDEO_FILE, "rb") as f:
            files = {"video": (VIDEO_FILE, f, "video/mp4")}
            data = {"caption": caption}
            response = requests.post(TIKTOK_MAKE_WEBHOOK_URL, files=files, data=data)
            
        if response.status_code == 200:
            print("[+] VIDEO INVIATO CON SUCCESSO A MAKE.COM!")
            return platform_result(True, "Inviato a Make.com per TikTok.")
        else:
            raise Exception(f"Make.com ha restituito errore {response.status_code}: {response.text}")
            
    except Exception as e:
        message = f"Errore durante l'invio a Make.com: {e}"
        print(f"[!] {message}")
        return platform_result(False, message)

def publish_to_youtube():
    if not os.path.exists(VIDEO_FILE):
        message = f"Il video {VIDEO_FILE} non esiste."
        print(f"[!] Errore: {message}")
        return platform_result(False, message)
        
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
            return platform_result(True, "Pubblicato su YouTube Shorts.", {"youtube_id": video_id})
            
    except Exception as e:
        message = f"Errore durante la pubblicazione su YouTube: {e}"
        print(f"[!] {message}")
        return platform_result(False, message)
    return platform_result(False, "YouTube non ha restituito un ID video.")

if __name__ == "__main__":
    print("=== INIZIO PUBBLICAZIONE MULTI-PIATTAFORMA ===")
    preflight, preflight_failed = run_preflight()
    if "--preflight" in sys.argv:
        results = {
            "instagram": platform_result(not bool("instagram" in preflight_failed), preflight["instagram"]["message"]),
            "tiktok": platform_result(not bool("tiktok" in preflight_failed), preflight["tiktok"]["message"]),
            "youtube": platform_result(not bool("youtube" in preflight_failed), preflight["youtube"]["message"]),
        }
        write_report(results, preflight)
        if preflight_failed:
            raise SystemExit(f"Preflight fallito per: {', '.join(preflight_failed)}")
        raise SystemExit(0)

    if STRICT_PUBLISH and preflight_failed:
        results = {
            "instagram": platform_result(False, "Non tentato: preflight fallito."),
            "tiktok": platform_result(False, "Non tentato: preflight fallito."),
            "youtube": platform_result(False, "Non tentato: preflight fallito."),
        }
        write_report(results, preflight)
        raise SystemExit(f"Preflight fallito per: {', '.join(preflight_failed)}")

    results = {
        "instagram": publish_to_instagram(),
    }
    print("----------------------------------------------")
    results["tiktok"] = publish_to_tiktok()
    print("----------------------------------------------")
    results["youtube"] = publish_to_youtube()
    print("=== PUBBLICAZIONE COMPLETATA ===")
    print("[*] Esito piattaforme:", results)
    write_report(results, preflight)

    if STRICT_PUBLISH:
        failed = [name for name, result in results.items() if not result.get("ok")]
        if failed:
            raise SystemExit(f"Pubblicazione fallita per: {', '.join(failed)}")
