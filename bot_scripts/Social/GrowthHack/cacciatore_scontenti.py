import os
import time
import random
from instagrapi import Client
import google.generativeai as genai
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

SESSION_FILE = "session_cacciatore.json"
SCONTENTI_FILE = "scontenti.txt"

# Target: Pagine ufficiali dei competitor su Instagram (da cui estrarre i clienti scontenti)
COMPETITOR_ACCOUNTS = ["treatwell_it", "uala_it", "booksybiz.it"]

def setup_gemini():
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if api_key:
        genai.configure(api_key=api_key)
        return True
    return False

def login_instagram():
    cl = Client()
    if os.path.exists(SESSION_FILE):
        print("📥 Caricamento sessione Instagram salvata...")
        cl.load_settings(SESSION_FILE)
        try:
            cl.get_timeline_feed()
            print("✅ Login effettuato tramite sessione.")
            return cl
        except Exception as e:
            print(f"⚠️ Sessione scaduta: {e}. Effettuo nuovo login...")
    
    username = os.environ.get("INSTA_USER", "")
    password = os.environ.get("INSTA_PASS", "")
    
    if not username or not password:
        print("❌ CRITICO: Inserire le credenziali INSTA_USER e INSTA_PASS nel file .env")
        return None
        
    try:
        print("🔄 Effettuo il login...")
        cl.login(username, password)
        cl.dump_settings(SESSION_FILE)
        print("✅ Login effettuato e sessione salvata.")
        return cl
    except Exception as e:
        print(f"❌ Errore durante il login: {e}")
        return None

def is_commento_negativo(testo):
    model = genai.GenerativeModel('gemini-1.5-flash-latest', generation_config={"response_mime_type": "text/plain"})
    prompt = f"""
    Questo è un commento lasciato da un utente sotto il post di un software gestionale per parrucchieri (es. Treatwell, Uala).
    Testo del commento: "{testo}"
    
    Rispondi SOLO con la parola "SI" se l'utente si sta lamentando, è scontento, critica il servizio o i costi alti.
    Rispondi SOLO con la parola "NO" se è un commento positivo, neutrale, o irrilevante.
    """
    try:
        response = model.generate_content(prompt)
        return "SI" in response.text.upper()
    except Exception:
        return False

def caccia_agli_scontenti(cl):
    print("\n🎯 AVVIO SNIPING SUI COMPETITOR 🎯")
    
    nuovi_scontenti = []
    
    for account in COMPETITOR_ACCOUNTS:
        print(f"🔍 Pattugliamento su @{account}...")
        try:
            user_id = cl.user_id_from_username(account)
            medias = cl.user_medias(user_id, amount=3) # Guarda gli ultimi 3 post
            
            for media in medias:
                comments = cl.media_comments(media.id, amount=20)
                for comment in comments:
                    username = comment.user.username
                    testo = comment.text
                    
                    if is_commento_negativo(testo):
                        print(f"   😡 Scontento Trovato! @{username} ha scritto: '{testo[:50]}...'")
                        nuovi_scontenti.append(username)
                        
                        # AZIONE IMMEDIATA: Metti mi piace al commento di lamentela.
                        # Il cliente del competitor riceverà la notifica: "NeatX ha messo Mi Piace al tuo commento".
                        # Si sentirà "capito", cliccherà sul profilo di NeatX e scoprirà l'alternativa.
                        try:
                            # cl.comment_like(comment.pk) # Scommenta per Like reale al commento
                            print(f"      ❤️  Messo Like tattico al commento di @{username}")
                        except:
                            pass
                        
                time.sleep(10) # Pausa tra un post e l'altro
                
        except Exception as e:
            print(f"❌ Errore con l'account {account}: {e}")
            
    # Salva la lista degli scontenti
    if nuovi_scontenti:
        with open(SCONTENTI_FILE, "a", encoding="utf-8") as f:
            for scontento in nuovi_scontenti:
                f.write(f"{scontento}\n")
        print(f"\n✅ Aggiunti {len(nuovi_scontenti)} nuovi potenziali clienti caldissimi alla lista nera.")
    else:
        print("\n🤷 Nessun commento negativo trovato oggi.")

def main():
    if not setup_gemini():
        print("[!] Errore: Gemini API Key mancante.")
        return
        
    cl = login_instagram()
    if not cl:
        return
        
    caccia_agli_scontenti(cl)

if __name__ == "__main__":
    main()
