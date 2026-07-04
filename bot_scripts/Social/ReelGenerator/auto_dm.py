import os
import json
import time
from instagrapi import Client
from dotenv import load_dotenv

load_dotenv()

SESSION_FILE = "session.json"
PROCESSED_COMMENTS_FILE = "processed_comments.json"

# ==========================================
# CONFIGURAZIONI (Modifica queste liberamente)
# ==========================================
# Le credenziali arrivano dai GitHub Secrets o dal file .env locale.
IG_USERNAME = os.environ.get("INSTA_USER", "")
IG_PASSWORD = os.environ.get("INSTA_PASS", "")

# Se un commento contiene una di queste parole, il bot si attiva
TRIGGER_WORDS = ["agenda"]

# Il messaggio che verrà inviato in PRIVATO (DM) all'utente
DM_MESSAGE_TEXT = "Ciao! Ho visto il tuo commento. Ecco il link per scaricare e provare NeatX gratuitamente per la tua attività: https://www.neatx.store/ \n\nFammi sapere se ti serve aiuto o hai domande!"

# La risposta pubblica che apparirà sotto al suo commento
PUBLIC_REPLY_TEXT = "Ti ho inviato il link in messaggio privato (DM)! 🚀"

# Quanti degli ultimi Reel vuoi che vengano tenuti sotto controllo?
CHECK_LATEST_N_POSTS = 5
# ==========================================

def load_processed_comments():
    if os.path.exists(PROCESSED_COMMENTS_FILE):
        try:
            with open(PROCESSED_COMMENTS_FILE, "r") as f:
                data = json.load(f)
                # Se è la vecchia versione (lista di stringhe), convertiamola
                if data and isinstance(data[0], str):
                    new_data = [{"comment_id": c, "user_id": "", "username": "", "timestamp": 0, "followed_up": True} for c in data]
                    return new_data
                return data
        except:
            return []
    return []

def save_processed_comments(processed_ids):
    with open(PROCESSED_COMMENTS_FILE, "w") as f:
        json.dump(processed_ids, f, indent=4)

def main():
    print("[*] Avvio Auto-DM Bot per NeatX...")
    
    cl = Client()
    
    # Ritardo per simulare comportamento umano ed evitare blocchi API
    cl.delay_range = [2, 5]
    
    if not IG_USERNAME or not IG_PASSWORD:
        print("[!] Errore: INSTA_USER e INSTA_PASS mancanti. Impostali nei GitHub Secrets o nel file .env locale.")
        return

    if os.path.exists(SESSION_FILE):
        print("[*] Caricamento sessione salvata...")
        cl.load_settings(SESSION_FILE)
        # Il login è necessario anche con le impostazioni caricate se la sessione scade, ma di solito basta load_settings
        # per sicurezza facciamo login se necessario
        try:
            user_id = cl.user_id_from_username(IG_USERNAME)
        except Exception:
            print("[*] Sessione scaduta, faccio il login...")
            cl.login(IG_USERNAME, IG_PASSWORD)
            user_id = cl.user_id_from_username(IG_USERNAME)
    else:
        print("[*] Effettuo il login per la prima volta...")
        cl.login(IG_USERNAME, IG_PASSWORD)
        cl.dump_settings(SESSION_FILE)
        user_id = cl.user_id_from_username(IG_USERNAME)

    processed_ids = load_processed_comments()
    
    try:
        print("[*] Recupero degli ultimi post...")
        medias = cl.user_medias(user_id, amount=CHECK_LATEST_N_POSTS)
    except Exception as e:
        print(f"[!] Errore nel recupero dei post: {e}")
        return

    for media in medias:
        print(f"[*] Controllo commenti per il post: {media.code}...")
        try:
            comments = cl.media_comments(media.id, amount=30)
        except Exception as e:
            print(f"  [!] Errore lettura commenti: {e}")
            continue
            
        for comment in comments:
            # Salta i commenti già gestiti in passato
            if any(str(comment.pk) == item["comment_id"] for item in processed_ids):
                continue
                
            # Salta i commenti fatti da noi stessi
            if str(comment.user.pk) == str(user_id):
                continue

            # Convertiamo il commento in minuscolo per facilitare la ricerca
            text_lower = comment.text.lower()
            
            # Se troviamo una parola chiave nel testo del commento
            if any(trigger in text_lower for trigger in TRIGGER_WORDS):
                print(f"  [+] Trovato commento target da @{comment.user.username}: '{comment.text}'")
                
                # 1. Invia il DM
                try:
                    cl.direct_send(DM_MESSAGE_TEXT, user_ids=[comment.user.pk])
                    print(f"    -> DM inviato a @{comment.user.username}")
                except Exception as e:
                    print(f"    [!] Errore invio DM: {e}")
                    continue
                
                # 2. Metti Like al commento
                try:
                    cl.comment_like(comment.pk)
                except:
                    pass
                
                # 3. Rispondi pubblicamente
                try:
                    cl.media_comment(media.id, PUBLIC_REPLY_TEXT, replied_to_comment_id=comment.pk)
                    print(f"    -> Risposta pubblica inserita sotto il commento")
                except Exception as e:
                    print(f"    [!] Errore risposta commento: {e}")
                    # Ripiego se replied_to_comment_id non funziona
                    try:
                        cl.media_comment(media.id, f"@{comment.user.username} {PUBLIC_REPLY_TEXT}")
                        print(f"    -> Risposta pubblica inserita (con @menzione classica)")
                    except:
                        pass
                
                # 4. Salva ID come completato nel database locale (nuova struttura)
                processed_ids.append({
                    "comment_id": str(comment.pk),
                    "user_id": str(comment.user.pk),
                    "username": comment.user.username,
                    "timestamp": time.time(),
                    "followed_up": False
                })
                save_processed_comments(processed_ids)
                
                # Attesa precauzionale per non essere bloccati da Instagram per SPAM
                time.sleep(10)

    print("[*] Controllo terminato! Nessun altro commento da gestire.")

if __name__ == "__main__":
    main()
