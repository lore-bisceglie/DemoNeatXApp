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

META_ACCESS_TOKEN = os.environ.get("META_PERMANENT_TOKEN", os.environ.get("META_ACCESS_TOKEN"))
IG_ACCOUNT_ID = os.environ.get("INSTAGRAM_BUSINESS_ACCOUNT_ID", os.environ.get("IG_ACCOUNT_ID"))
TIKTOK_SESSION_ID = os.environ.get("TIKTOK_SESSION_ID")
TIKTOK_HEADLESS = os.environ.get(
    "TIKTOK_HEADLESS",
    "true" if os.environ.get("GITHUB_ACTIONS") else "false",
).lower() in ("1", "true", "yes", "y")
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
            bool(os.environ.get("TIKTOK_MAKE_WEBHOOK_URL")),
            "Richiede TIKTOK_MAKE_WEBHOOK_URL valido (Make.com webhook).",
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
            return data.get("caption", "Scopri come automatizzare il tuo business con NeatX! #perte #fyp #foryou #viral #imprenditore #businessitalia")
    return "Scopri come automatizzare il tuo business con NeatX! 🚀 #NeatX #Business #Automazione"
# Servizi di fallback per l'upload (sia video che copertina)
FALLBACK_SERVICES = [
    {
        "url": "https://tmpfiles.org/api/v1/upload",
        "files_name": "file",
        "parse": lambda r: r.json().get("data", {}).get("url", "").replace("tmpfiles.org/", "tmpfiles.org/dl/"),
    },
    {
        "url": "https://file.io",
        "files_name": "file",
        "parse": lambda r: r.json().get("link", ""),
    },
]

def upload_video_fallback():
    for svc in FALLBACK_SERVICES:
        try:
            print(f"    Provo {svc['url']}...")
            r = requests.post(
                svc["url"],
                files={svc["files_name"]: open(VIDEO_FILE, "rb")},
                timeout=120
            )
            url = svc["parse"](r)
            if url.startswith("http"):
                print(f"    [+] URL alternativo: {url}")
                return url
        except Exception as e:
            print(f"    [!] Fallito: {e}")
    return None

SHARED_VIDEO_URL = None

def get_shared_video_url():
    global SHARED_VIDEO_URL
    if SHARED_VIDEO_URL:
        return SHARED_VIDEO_URL

    print(f"[*] Caricamento del video {VIDEO_FILE} su server temporaneo...")
    max_retries = 5
    for attempt in range(1, max_retries + 1):
        try:
            r_upload = requests.post(
                "https://litterbox.catbox.moe/resources/internals/api.php",
                data={"reqtype": "fileupload", "time": "24h"},
                files={"fileToUpload": open(VIDEO_FILE, "rb")},
                timeout=120
            )
            video_url = r_upload.text.strip()

            if not video_url.startswith("http"):
                raise Exception(f"Risposta non valida dal server temporaneo: {video_url[:200]}")
                
            print(f"[+] URL temporaneo generato: {video_url}")
            SHARED_VIDEO_URL = video_url
            return video_url
        except Exception as e:
            print(f"[!] Tentativo {attempt}/{max_retries} fallito: {e}")
            if attempt < max_retries:
                wait = min(2 ** attempt, 30)
                print(f"    Nuovo tentativo tra {wait}s...")
                time.sleep(wait)
            else:
                print(f"[!] catbox.moe fallito dopo {max_retries} tentativi, provo upload alternativo...")
                video_url = upload_video_fallback()
                if video_url:
                    SHARED_VIDEO_URL = video_url
                    return video_url
    return None

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
    
    # 1. Caricamento temporaneo del video (per permettere a Meta e Make di scaricarlo)
    video_url = get_shared_video_url()
    if not video_url:
        message = "Errore durante il caricamento temporaneo del video."
        print("[!]", message)
        return platform_result(False, message)
        
    # 2. Caricamento temporaneo della copertina (con retry)
    cover_url = ""
    path_cover = "assets/cover.png"
    if os.path.exists(path_cover):
        print(f"[*] Caricamento della copertina {path_cover} su server temporaneo...")
        for attempt in range(1, 4):
            try:
                r_cover = requests.post(
                    "https://litterbox.catbox.moe/resources/internals/api.php",
                    data={"reqtype": "fileupload", "time": "24h"},
                    files={"fileToUpload": open(path_cover, "rb")},
                    timeout=60
                )
                cover_url_temp = r_cover.text.strip()
                if not cover_url_temp.startswith("http"):
                    raise Exception(f"Risposta copertina non valida: {cover_url_temp[:200]}")
                cover_url = cover_url_temp
                print(f"[+] URL copertina generato: {cover_url}")
                break
            except Exception as e:
                print(f"[!] Tentativo copertina {attempt}/3 fallito: {e}")
                if attempt < 3:
                    time.sleep(2 ** attempt)
                else:
                    print("[!] catbox.moe fallito per la copertina, provo upload alternativo...")
                    for svc in FALLBACK_SERVICES:
                        try:
                            print(f"    Provo {svc['url']} per la copertina...")
                            r_alt = requests.post(
                                svc["url"],
                                files={svc["files_name"]: open(path_cover, "rb")},
                                timeout=60
                            )
                            cover_url_temp = svc["parse"](r_alt)
                            if cover_url_temp.startswith("http"):
                                cover_url = cover_url_temp
                                print(f"    [+] URL alternativo copertina: {cover_url}")
                                break
                        except Exception as e_alt:
                            print(f"    [!] Alternativa copertina fallita: {e_alt}")
                    print("[!] Caricamento copertina fallito dopo 3 tentativi, proseguo senza.")
    
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
    
    r = requests.post(url_media, data=payload, timeout=60)
    if r.status_code != 200:
        message = f"Errore creazione container: {r.text}"
        print("[!]", message)
        return platform_result(False, message)

    container_id = r.json().get("id")
    print(f"[+] Container creato con ID: {container_id}")

    # 4. Polling stato caricamento
    print("[*] Attesa che Meta elabori il video (ci vorrà un po')...")
    url_status = f"https://graph.facebook.com/v21.0/{container_id}?fields=status_code&access_token={META_ACCESS_TOKEN}"

    max_polls = 60  # max ~5 minuti (60 x 5s)
    for _ in range(max_polls):
        try:
            status_req = requests.get(url_status, timeout=30)
            status = status_req.json().get("status_code", "UNKNOWN")
        except (requests.RequestException, ValueError) as exc:
            print(f"    Errore temporaneo nel polling: {exc}, riprovo...")
            time.sleep(5)
            continue
        print(f"    Stato: {status}")
        if status == "FINISHED":
            break
        elif status == "ERROR":
            message = "Errore durante l'elaborazione del video su Meta."
            print("[!]", message)
            return platform_result(False, message, {"container_id": container_id})
        time.sleep(5)
    else:
        message = "Timeout: Meta non ha completato l'elaborazione del video entro 5 minuti."
        print("[!]", message)
        return platform_result(False, message, {"container_id": container_id})

    # 5. Pubblicazione
    print("[*] Pubblicazione sul profilo Instagram...")
    url_publish = f"https://graph.facebook.com/v21.0/{IG_ACCOUNT_ID}/media_publish"
    pub_payload = {
        "creation_id": container_id,
        "access_token": META_ACCESS_TOKEN
    }

    r_pub = requests.post(url_publish, data=pub_payload, timeout=60)
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
    webhook_url = os.environ.get("TIKTOK_MAKE_WEBHOOK_URL", "").strip()
    if not webhook_url:
        message = "TIKTOK_MAKE_WEBHOOK_URL mancante in .env o GitHub Secrets."
        print(f"[!] Errore: {message}")
        return platform_result(False, message)
        
    if not os.path.exists(VIDEO_FILE):
        message = f"Il video {VIDEO_FILE} non esiste."
        print(f"[!] Errore: {message}")
        return platform_result(False, message)
        
    caption = get_caption()
    
    print("[*] Preparazione video per TikTok via Make.com...")
    video_url = get_shared_video_url()
    if not video_url:
        return platform_result(False, "Impossibile caricare il video sul server temporaneo.")

    print(f"[*] Invio webhook a Make.com...")
    try:
        r = requests.post(webhook_url, json={
            "video_url": video_url,
            "caption": caption
        }, timeout=30)
        
        if r.ok:
            print("[+] VIDEO INVIATO CON SUCCESSO A MAKE.COM (TikTok)!")
            return platform_result(True, "Inviato al Webhook Make.com.")
        else:
            return platform_result(False, f"Make.com ha restituito errore: {r.status_code} {r.text}")
    except Exception as e:
        return platform_result(False, f"Errore di connessione a Make.com: {e}")

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


def publish_instagram_puppeteer(caption):
    print('[*] Tentativo di pubblicazione su Instagram via Puppeteer (fallback)...')
    # Implementazione di emergenza per forzare l'upload via browser
    import subprocess
    try:
        subprocess.run(['node', 'puppeteer_ig_upload.js', VIDEO_FILE, caption], check=True)
        return platform_result(True, 'Pubblicato via Puppeteer')
    except Exception as e:
        return platform_result(False, f'Errore Puppeteer: {e}')



def publish_instagram_instagrapi(caption):
    print('[*] Tentativo di pubblicazione su Instagram via Instagrapi (fallback)...')
    from instagrapi import Client
    try:
        cl = Client()
        cl.login(os.environ.get('IG_USERNAME'), os.environ.get('IG_PASSWORD'))
        media = cl.clip_upload(VIDEO_FILE, caption)
        return platform_result(True, 'Pubblicato via Instagrapi', {'post_id': media.pk})
    except Exception as e:
        return platform_result(False, f'Errore Instagrapi: {e}')

