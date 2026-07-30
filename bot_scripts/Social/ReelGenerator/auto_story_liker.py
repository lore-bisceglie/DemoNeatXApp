import os
import sys
import json
import time
import random
import requests
from dotenv import load_dotenv

load_dotenv()

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from typing import List, Dict, Set
from instagrapi import Client
from auto_dm import IG_USERNAME, IG_PASSWORD, SESSION_FILE

HISTORY_FILE = "liked_stories_history.json"

# ==========================================
# CONFIGURAZIONI DEL NINJA 🥷
# ==========================================
# Quanti profili cercare per ogni parola chiave
MAX_PROFILES_PER_QUERY = 15

# Pausa (in secondi) tra un "Mi Piace" e l'altro per non sembrare un bot
DELAY_BETWEEN_LIKES = (30, 90)

# Parole chiave da cercare su Instagram (se non si usano i file CSV)
SEARCH_QUERIES = [
    "parrucchiere milano",
    "centro estetico torino",
    "barbiere roma",
]
# ==========================================

def load_history() -> Set[str]:
    """Carica i nomi utente già contattati/likati per non fargli spam."""
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return set(data)
        except Exception:
            return set()
    return set()

def save_history(history_set: Set[str]):
    """Salva la storia su file."""
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(list(history_set), f, indent=4)

def setup_client() -> Client:
    cl = Client()
    # Imposta un delay globale di base della libreria
    cl.delay_range = [2, 5]
    
    if os.path.exists(SESSION_FILE):
        print("[*] Caricamento sessione salvata...")
        cl.load_settings(SESSION_FILE)
        try:
            cl.user_id_from_username(IG_USERNAME)
        except Exception:
            print("[!] Sessione scaduta, eseguo un nuovo login...")
            cl.login(IG_USERNAME, IG_PASSWORD)
    else:
        print("[*] Nessuna sessione trovata. Eseguo il login...")
        cl.login(IG_USERNAME, IG_PASSWORD)
        cl.dump_settings(SESSION_FILE)
    
    return cl

def main():
    print("=========================================")
    print("[🥷] AVVIO STORY NINJA (Liker Bot) [🥷]")
    print("=========================================\n")
    
    if not IG_USERNAME or not IG_PASSWORD:
        print("[!] Errore: Credenziali mancanti. Assicurati che INSTA_USER e INSTA_PASS siano configurati.")
        return

    history = load_history()
    print(f"[*] Profili già 'colpiti' in passato: {len(history)}")
    
    cl = setup_client()
    print(f"[*] Autenticato come: {IG_USERNAME}\n")
    
    likes_given_today = 0
    liked_today_usernames = []
    
    for query in SEARCH_QUERIES:
        print(f"🔍 Ricerca profili per: '{query}'")
        try:
            users = cl.search_users(query)
            # Prendiamo solo i primi N risultati per non esagerare
            users = users[:MAX_PROFILES_PER_QUERY]
        except Exception as e:
            print(f"  [!] Errore durante la ricerca '{query}': {e}")
            continue
            
        print(f"  Trovati {len(users)} profili potenziali.")
        
        for user in users:
            # Controllo anti-spam: saltiamo se l'abbiamo già likato
            if user.username in history:
                print(f"  ⏭️ {user.username} (Già visitato, salto)")
                continue
                
            print(f"  👀 Controllo storie per @{user.username}...")
            
            try:
                # Prendiamo le storie dell'utente
                stories = cl.user_stories(user.pk)
                
                if stories:
                    # Trovata almeno una storia!
                    target_story = stories[0]
                    print(f"    🌟 Trovata una storia! Metto 'Mi Piace'...")
                    
                    # Mettiamo Mi Piace
                    cl.story_like(target_story.id)
                    
                    print(f"    ✅ Mi piace messo con successo alla storia di @{user.username}")
                    
                    # Salviamo in cronologia
                    history.add(user.username)
                    save_history(history)
                    likes_given_today += 1
                    liked_today_usernames.append(user.username)
                    
                    # Pausa umana anti-ban
                    sleep_time = random.randint(DELAY_BETWEEN_LIKES[0], DELAY_BETWEEN_LIKES[1])
                    print(f"    ⏳ Pausa mimetica di {sleep_time} secondi...\n")
                    time.sleep(sleep_time)
                else:
                    print(f"    ❌ Niente storie attive in questo momento.")
                    # Anche se non ha storie, lo aggiungiamo in history? 
                    # Meglio di no, così magari riproviamo domani quando le pubblica.
                    time.sleep(random.randint(2, 5))
                    
            except Exception as e:
                print(f"    [!] Errore durante l'interazione con @{user.username}: {e}")
                time.sleep(10)
                
    print("\n=========================================")
    print(f"[✅] TURNO CONCLUSO. Mi piace messi oggi: {likes_given_today}")
    print("=========================================")
    
    # Invia notifica Telegram con i prospect riscaldati
    bot_token = os.environ.get("TELEGRAM_BOT_TOKEN")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID")
    if bot_token and chat_id and liked_today_usernames:
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        text = "🥷 *Story Ninja Report*\n\n"
        text += "Ho appena messo 'Mi Piace' alle storie di questi prospect. Sono 'caldi', vai a scrivergli un DM!\n\n"
        for username in liked_today_usernames:
            text += f"- @{username} (https://instagram.com/{username})\n"
            
        try:
            requests.post(url, json={"chat_id": chat_id, "text": text, "parse_mode": "Markdown", "disable_web_page_preview": True})
            print("[*] Lista prospect inviata su Telegram!")
        except Exception as e:
            print(f"[!] Errore invio report Telegram: {e}")

if __name__ == "__main__":
    main()
