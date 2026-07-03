import os
import time
import random
from instagrapi import Client
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

SESSION_FILE = "session_cacciatore.json"

# Target di ricerca: espanso a TUTTI i professionisti che lavorano su appuntamento in Italia
TARGET_HASHTAGS = [
    # Capelli e Bellezza
    "barbiereitaliano", "parrucchiere", "estetista", "nailsitalia", "onicotecnica", "laserdiodo",
    # Salute e Benessere
    "fisioterapista", "osteopata", "nutrizionista", "massaggiatore",
    # Fitness e Sport
    "personaltraineritalia", "palestra", "insegnanteyoga", "pilatesitalia",
    # Altre professioni a prenotazione
    "tatuatoreitaliano", "tattoostudio", "fotografoitalia", "psicologo"
]

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

def cacciatore_silenzioso(cl):
    print("\n🕵️‍♂️ CACCIATORE SILENZIOSO ATTIVO 🕵️‍♂️")
    print("Obiettivo: Lasciare notifiche sui profili dei barbieri per attirarli sulla tua vetrina.")
    
    hashtag = random.choice(TARGET_HASHTAGS)
    print(f"🔍 Scansione hashtag: #{hashtag}")
    
    try:
        # Prende 15 post recenti da quell'hashtag
        medias = cl.hashtag_medias_recent(hashtag, amount=15)
        
        profili_visitati = 0
        for media in medias:
            # Estraggo il proprietario del post (che al 99% è un barbiere)
            user_id = media.user.pk
            username = media.user.username
            
            print(f"👀 Trovato potenziale cliente: @{username}")
            
            # STRATEGIA ANTI-BAN: Invece di seguire (Follow), lasciamo un Like tattico.
            # Il Like genera una notifica sul suo telefono. Lui la legge, vede il tuo nome,
            # clicca sul tuo profilo per curiosità, vede il tuo Link in Bio (Acconciature da Mito) e impazzisce.
            
            # 1. Mettiamo Like al post che abbiamo trovato
            try:
                # Scommentare la riga sotto per abilitare il Like REALE
                # cl.media_like(media.id)
                print(f"   ❤️  Like lasciato sul post di @{username}")
            except Exception as e:
                print(f"   ⚠️ Impossibile mettere like a {username}: {e}")
            
            # 2. Guardiamo le sue Storie in silenzio (Visualizzazione Storie)
            try:
                user_stories = cl.user_stories(user_id)
                if user_stories:
                    # Scommentare la riga sotto per abilitare la visualizzazione REALE
                    # cl.story_seen([story.id for story in user_stories])
                    print(f"   👁️  Guardate le storie di @{username} in incognito.")
                else:
                    print(f"   (Nessuna storia attiva per @{username})")
            except Exception as e:
                pass

            profili_visitati += 1
            
            # Pausa lunga e casuale per simulare il comportamento di un umano che scrolla (Anti-Ban)
            attesa = random.randint(45, 120)
            print(f"   ⏳ Pausa umana di {attesa} secondi...")
            time.sleep(attesa)
            
            # Ci fermiamo dopo 5 profili per run per restare sicurissimi sotto i radar di Instagram
            if profili_visitati >= 5:
                break
                
        print("\n✅ Scansione completata. I barbieri troveranno la tua notifica e visiteranno il tuo profilo.")
            
    except Exception as e:
        print(f"❌ Errore durante la caccia: {e}")

def main():
    cl = login_instagram()
    if not cl:
        return
        
    cacciatore_silenzioso(cl)

if __name__ == "__main__":
    main()
