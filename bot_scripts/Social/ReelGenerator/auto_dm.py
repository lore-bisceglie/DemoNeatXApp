import os
import json
import time
import random
from instagrapi import Client
from dotenv import load_dotenv

load_dotenv()

SESSION_FILE = "session.json"
PROCESSED_COMMENTS_FILE = "processed_comments.json"

# ==========================================
# CONFIGURAZIONI
# ==========================================
IG_USERNAME = os.environ.get("IG_USERNAME", os.environ.get("INSTA_USER", ""))
IG_PASSWORD = os.environ.get("IG_PASSWORD", os.environ.get("INSTA_PASS", ""))

TRIGGER_WORDS = [
    "agenda", "info", "prezzo", "costo", "link", "demo", "provare",
    "funziona", "come si fa", "interessato", "voglio", "aiuto",
    "contatt", "disponibile", "consigli", "consiglio", "cos'è",
    "neatx", "appuntament", "prenot", "prova", "gratis",
    "gratuito", "provarlo", "funzione", "come funziona", "messaggio",
    "whatsapp", "prezzi", "costa", "quanto",
]

DM_TEMPLATES = [
    (
        "Ehi ciao! Grazie mille per il commento 🙏 Ti lascio subito il link diretto a NeatX: https://www.neatx.store/\n\n"
        "Ci metti davvero due minuti a farti la tua agenda online. Fammi sapere se ti serve una mano a impostare qualcosa!"
    ),
    (
        "Ciao! Eccomi, ti giro il link come richiesto: https://www.neatx.store/\n\n"
        "Puoi registrarti subito e iniziare ad automatizzare gli appuntamenti e azzerare i ritardi. Se hai qualsiasi dubbio scrivimi pure qui in chat! 👋"
    ),
    (
        "Ehi, grazie per l'interesse! Ti lascio il link per farti la tua pagina appuntamenti: https://www.neatx.store/\n\n"
        "È comodissima per i promemoria automatici ai clienti. Se vuoi un consiglio su come usarla al meglio per il tuo settore, dimmi pure!"
    ),
    (
        "Ciao! Ecco qui il link di NeatX: https://www.neatx.store/\n\n"
        "L'obiettivo è liberarti dalle chat per gli appuntamenti e gestire tutto in automatico. Dacci un'occhiata e fammi sapere cosa ne pensi!"
    ),
]

PUBLIC_REPLIES = [
    "Ti ho scritto in DM con il link! 📩",
    "Ti ho inviato il link in privato! Controlla la richiesta 💬",
    "Guarda le richieste messaggi, ti ho inviato tutto li! ✅",
    "Risposto in DM! Se non vedi il messaggio, controlla le richieste 📥",
]

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
                
                # Scegli template random per variare
                dm_text = random.choice(DM_TEMPLATES)
                pub_text = random.choice(PUBLIC_REPLIES)
                
                # 1. Invia il DM
                try:
                    cl.direct_send(dm_text, user_ids=[comment.user.pk])
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
                    cl.media_comment(media.id, pub_text, replied_to_comment_id=comment.pk)
                    print(f"    -> Risposta pubblica inserita sotto il commento")
                except Exception as e:
                    print(f"    [!] Errore risposta commento: {e}")
                    try:
                        cl.media_comment(media.id, f"@{comment.user.username} {pub_text}")
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
