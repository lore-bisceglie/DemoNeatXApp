import os
import json
import time
import random
from instagrapi import Client
from auto_dm import IG_USERNAME, IG_PASSWORD, SESSION_FILE, PROCESSED_COMMENTS_FILE, load_processed_comments, save_processed_comments

FOLLOWUP_TEMPLATES = [
    "Ciao! Sei riuscito a dare un'occhiata alla demo NeatX? Se hai domande o vuoi una versione personalizzata per la tua attività, scrivimi pure!",
    "Hey! Hai già provato la demo? Se ti serve una mano a configurarla per il tuo business, sono qui!",
    "Ci hai fatto un pensiero? Se vuoi vedere come NeatX funziona per la tua categoria specifica, fammi sapere che ti mostro!",
    "Ancora nessuna domanda? Se hai avuto problemi con la demo o vuoi chiarimenti, basta un messaggio!",
]

INITIAL_HOURS = 24
REMINDER_HOURS = 72

def main():
    print("=========================================")
    print("[*] AVVIO FOLLOW-UP MAGICO NEATX [*]")
    print("=========================================\n")
    
    processed_ids = load_processed_comments()
    
    # Cerchiamo utenti che devono ricevere il follow-up
    to_follow_up_24 = []
    to_follow_up_72 = []
    current_time = time.time()
    
    for item in processed_ids:
        if type(item) is not dict:
            continue
        
        # Primo follow-up dopo 24h (segna come followed_up=False all'inizio)
        if not item.get("followed_up", True):
            elapsed = current_time - item.get("timestamp", 0)
            if elapsed >= (INITIAL_HOURS * 3600):
                to_follow_up_24.append(item)
        


    if not to_follow_up_24:
        print("[*] Nessun utente necessita di Follow-Up al momento.")
        return

    print(f"[*] Follow-up 24h: {len(to_follow_up_24)} utenti")
    
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

    for user in to_follow_up_24:
        msg = random.choice(FOLLOWUP_TEMPLATES)
        try:
            cl.direct_send(msg, user_ids=[int(user["user_id"])])
            user["followed_up"] = True
            user["followed_up_at"] = time.time()
            save_processed_comments(processed_ids)
            print(f"  [+] Follow-up 24h inviato a @{user['username']}")
            time.sleep(15)
        except Exception as e:
            print(f"  [!] Errore follow-up 24h @{user['username']}: {e}")



    print("\n[+] Follow-Up Completato.")

if __name__ == "__main__":
    main()
