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

# Costanti
SESSION_FILE = "session.json"
TARGET_ACCOUNTS = ["ilmilaneseimbruttito", "boss.of.barbers", "marco_montemagno"] # Pagine grosse da cui drenare traffico
CHECK_INTERVAL_MINUTES = 10 # Controlla ogni 10 minuti
PROCESSED_POSTS_FILE = "commented_posts.txt"

# Inizializza Gemini
GOOGLE_API_KEY = os.environ.get("GEMINI_API_KEY", "") # Assicurati di impostare l'ambiente
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash')
else:
    print("⚠️ ATTENZIONE: Nessuna API Key di Gemini trovata. Il commentatore utilizzerà commenti generici (non consigliato).")
    model = None

def load_processed_posts():
    if not os.path.exists(PROCESSED_POSTS_FILE):
        return set()
    with open(PROCESSED_POSTS_FILE, "r") as f:
        return set(line.strip() for line in f)

def save_processed_post(media_id):
    with open(PROCESSED_POSTS_FILE, "a") as f:
        f.write(f"{media_id}\n")

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

def generate_smart_comment(username, caption):
    if not model:
        generics = ["Verissimo! 🔥", "Assolutamente d'accordo 🙌", "Questo è il livello successivo 🚀"]
        return random.choice(generics)
        
    prompt = f"""
    Sei un commentatore social esperto, arguto e brillante.
    Il tuo obiettivo è scrivere un commento breve, d'impatto e che attiri tanti "Mi Piace" per finire in cima alla sezione commenti.
    
    L'autore del post è @{username}.
    La didascalia del post è: "{caption}"
    
    Regole:
    - Sii breve (massimo 15 parole).
    - Usa un tono amichevole, a volte leggermente sarcastico o ironico, ma mai offensivo.
    - Non sembrare un bot. Parla in italiano naturale.
    - Se ha senso per l'autore o il post, fai un'osservazione intelligente.
    - NESSUN hashtag.
    - Rispondi SOLO con il testo del commento, nient'altro.
    """
    
    try:
        response = model.generate_content(prompt)
        comment = response.text.strip().replace('"', '')
        return comment
    except Exception as e:
        print(f"Errore Gemini: {e}")
        return "Concordo al 100% 🔥"

def sniper_mode(cl):
    processed = load_processed_posts()
    
    print("\n🎯 SNIPER COMMENTI ATTIVO 🎯")
    print("In attesa di nuove prede...")
    
    for username in TARGET_ACCOUNTS:
        try:
            user_id = cl.user_id_from_username(username)
            # Prende solo l'ultimo post
            medias = cl.user_medias(user_id, amount=1)
            
            if not medias:
                continue
                
            latest_post = medias[0]
            media_id = latest_post.id
            
            if media_id in processed:
                continue # Già commentato
                
            # Verifica se il post è uscito da poco (es. ultime 2 ore)
            post_time = latest_post.taken_at
            now = time.time() # Assicurati di gestire bene timezone se necessario
            
            print(f"🚨 NUOVO POST INDIVIDUATO: @{username}")
            caption = latest_post.caption_text if latest_post.caption_text else ""
            
            comment_text = generate_smart_comment(username, caption)
            print(f"✍️  Commento generato dall'AI: {comment_text}")
            
            # Decommenta la riga sotto per abilitare i commenti reali
            # cl.media_comment(media_id, comment_text)
            print(f"✅ Commento sparato su instagram.com/p/{latest_post.code}/")
            
            save_processed_post(media_id)
            processed.add(media_id)
            
            # Pausa random tra i commenti per sembrare umani
            time.sleep(random.randint(30, 90))
            
        except Exception as e:
            print(f"❌ Errore con @{username}: {e}")

def main():
    cl = login_instagram()
    if not cl:
        return
        
    print("Avvio singola scansione Sniper (Modalità GitHub Actions)...")
    sniper_mode(cl)
    print("Scansione completata. Chiusura bot.")

if __name__ == "__main__":
    main()
