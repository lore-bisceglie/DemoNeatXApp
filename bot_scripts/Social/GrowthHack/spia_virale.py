import os
import json
import time
from instagrapi import Client
import requests
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Costanti
SESSION_FILE = "session.json"
TARGET_ACCOUNTS = ["ilmilaneseimbruttito", "barber_niche_page", "garyvee"] # Sostituisci con i tuoi target reali
OUTLIER_THRESHOLD = 2.0 # Consideriamo "virale" un video con il doppio (2x) delle views medie

def login_instagram():
    cl = Client()
    if os.path.exists(SESSION_FILE):
        print("📥 Caricamento sessione Instagram salvata...")
        cl.load_settings(SESSION_FILE)
        try:
            cl.get_timeline_feed() # Test login
            print("✅ Login effettuato tramite sessione.")
            return cl
        except Exception as e:
            print(f"⚠️ Sessione scaduta: {e}. Effettuo nuovo login...")
    
    # Usa variabili d'ambiente o .env per automazione 100%
    username = os.environ.get("INSTA_USER", "")
    password = os.environ.get("INSTA_PASS", "")
    
    if not username or not password:
        print("❌ CRITICO: Credenziali INSTA_USER e INSTA_PASS non trovate nell'ambiente. Il bot non può operare in automatico.")
        return None
        cl.login(username, password)
        cl.dump_settings(SESSION_FILE)
        print("✅ Login effettuato e sessione salvata.")
        return cl
    except Exception as e:
        print(f"❌ Errore durante il login: {e}")
        return None

def find_viral_outliers(cl, username, limit=15):
    print(f"🔍 Analizzo l'account: @{username}")
    try:
        user_id = cl.user_id_from_username(username)
        medias = cl.user_medias(user_id, amount=limit)
        
        # Filtra solo i video/Reels e raccoglie le views
        videos = [m for m in medias if m.media_type == 2] # 2 = Video/Reel
        
        if not videos:
            print(f"  Nessun video trovato per @{username}.")
            return []

        views = [v.view_count for v in videos if v.view_count is not None]
        if not views:
            print(f"  Impossibile leggere le views per @{username}.")
            return []

        avg_views = sum(views) / len(views)
        print(f"  📊 Views Medie: {int(avg_views)}")
        
        outliers = []
        for v in videos:
            if v.view_count and v.view_count > (avg_views * OUTLIER_THRESHOLD):
                multiplier = round(v.view_count / avg_views, 1)
                print(f"  🚀 VIDEO VIRALE TROVATO! {multiplier}x views medie ({v.view_count} views)")
                print(f"     URL: https://www.instagram.com/p/{v.code}/")
                print(f"     Testo: {v.caption_text[:100]}...\n")
                outliers.append({
                    "username": username,
                    "url": f"https://www.instagram.com/p/{v.code}/",
                    "views": v.view_count,
                    "avg_views": avg_views,
                    "multiplier": multiplier,
                    "caption": v.caption_text
                })
        
        return outliers

    except Exception as e:
        print(f"❌ Errore durante l'analisi di @{username}: {e}")
        return []

def save_outliers(outliers, filename="viral_hits.json"):
    if not outliers:
        return
    
    existing = []
    if os.path.exists(filename):
        with open(filename, "r", encoding="utf-8") as f:
            try:
                existing = json.load(f)
            except json.JSONDecodeError:
                pass
                
    # Aggiungi solo i nuovi URL
    existing_urls = {item["url"] for item in existing}
    new_items = [item for item in outliers if item["url"] not in existing_urls]
    
    if new_items:
        existing.extend(new_items)
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(existing, f, indent=4, ensure_ascii=False)
        print(f"💾 Salvati {len(new_items)} nuovi video virali in {filename}!")
    else:
        print("🤷 Nessun nuovo video virale da aggiungere al database.")

def main():
    print("====================================")
    print("👁️  SPIA VIRALE NEATX AVVIATA 👁️")
    print("====================================")
    
    cl = login_instagram()
    if not cl:
        return

    all_outliers = []
    for target in TARGET_ACCOUNTS:
        outliers = find_viral_outliers(cl, target)
        all_outliers.extend(outliers)
        time.sleep(3) # Pausa per non insospettire l'algoritmo
        
    save_outliers(all_outliers)
    print("\n✅ Scansione completata!")

if __name__ == "__main__":
    main()
