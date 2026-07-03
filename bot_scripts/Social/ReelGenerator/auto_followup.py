import os
import json
import time
from instagrapi import Client
from auto_dm import IG_USERNAME, IG_PASSWORD, SESSION_FILE, PROCESSED_COMMENTS_FILE, load_processed_comments, save_processed_comments

FOLLOWUP_MESSAGE = "Ciao! Sei riuscito a provare la Demo di NeatX? Se hai domande o ti serve una versione su misura per la tua attività scrivimi pure qui!"
HOURS_WAIT = 24

def main():
    print("=========================================")
    print("[*] AVVIO FOLLOW-UP MAGICO NEATX [*]")
    print("=========================================\n")
    
    processed_ids = load_processed_comments()
    
    # Cerchiamo utenti che devono ricevere il follow-up
    to_follow_up = []
    current_time = time.time()
    
    for item in processed_ids:
        # Se è un vecchio record senza timestamp, lo skippiamo (già segnato come followed_up=True dalla migrazione)
        if type(item) is dict and not item.get("followed_up", True):
            elapsed_seconds = current_time - item.get("timestamp", 0)
            if elapsed_seconds >= (HOURS_WAIT * 3600):
                to_follow_up.append(item)
                
    if not to_follow_up:
        print("[*] Nessun utente necessita di Follow-Up al momento.")
        return
        
    print(f"[*] Trovati {len(to_follow_up)} utenti da ricontattare!")
    
    # Login a Instagram
    cl = Client()
    cl.delay_range = [2, 5]
    
    if os.path.exists(SESSION_FILE):
        print("[*] Caricamento sessione salvata...")
        cl.load_settings(SESSION_FILE)
        try:
            cl.user_id_from_username(IG_USERNAME)
        except:
            cl.login(IG_USERNAME, IG_PASSWORD)
    else:
        cl.login(IG_USERNAME, IG_PASSWORD)
        cl.dump_settings(SESSION_FILE)
        
    for user in to_follow_up:
        print(f"[*] Invio Follow-up a @{user['username']}...")
        try:
            cl.direct_send(FOLLOWUP_MESSAGE, user_ids=[int(user["user_id"])])
            print(f"  [+] Follow-up inviato con successo!")
            user["followed_up"] = True
            save_processed_comments(processed_ids)
            time.sleep(15) # Attesa per non sembrare spam
        except Exception as e:
            print(f"  [!] Errore durante l'invio a @{user['username']}: {e}")
            
    print("\n[+] Operazione Follow-Up Completata.")

if __name__ == "__main__":
    main()
