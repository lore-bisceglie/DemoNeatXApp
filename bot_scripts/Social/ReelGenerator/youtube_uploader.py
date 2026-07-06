import os
import json
import time
import google_auth_oauthlib.flow
import googleapiclient.discovery
import googleapiclient.errors
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.http import MediaFileUpload
from dotenv import load_dotenv

load_dotenv()

# Scope richiesti per caricare video
SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]

CLIENT_SECRETS_FILE = "client_secrets.json"
TOKEN_FILE = "token.json"

def get_authenticated_service():
    creds = None
    token_from_env = False
    # Il token memorizza i permessi di accesso dell'utente, viene creato
    # automaticamente al primo login eseguito con successo.
    youtube_token_json = os.environ.get("YOUTUBE_TOKEN_JSON")
    if youtube_token_json:
        try:
            creds = Credentials.from_authorized_user_info(json.loads(youtube_token_json), SCOPES)
            token_from_env = True
        except Exception as e:
            print(f"[!] Errore lettura YOUTUBE_TOKEN_JSON: {e}")
            creds = None
    elif os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    
    # Se non ci sono credenziali valide, avvia il flusso di login.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
            except Exception as e:
                print(f"[!] Errore durante il refresh del token: {e}")
                creds = None
                
        if not creds:
            client_secrets_json = os.environ.get("YOUTUBE_CLIENT_SECRETS_JSON")
            if client_secrets_json:
                with open(CLIENT_SECRETS_FILE, "w", encoding="utf-8") as f:
                    f.write(client_secrets_json)

            if not os.path.exists(CLIENT_SECRETS_FILE):
                print(f"[!] Errore: File {CLIENT_SECRETS_FILE} non trovato!")
                print("Devi scaricarlo da Google Cloud Console come spiegato nelle istruzioni.")
                return None

            if os.environ.get("GITHUB_ACTIONS"):
                print("[!] Errore: token YouTube mancante/non valido. In GitHub Actions imposta YOUTUBE_TOKEN_JSON.")
                return None
                
            flow = google_auth_oauthlib.flow.InstalledAppFlow.from_client_secrets_file(
                CLIENT_SECRETS_FILE, SCOPES)
            creds = flow.run_local_server(port=0)
            
        # Salva le credenziali per il prossimo avvio
        if not token_from_env:
            with open(TOKEN_FILE, 'w') as token:
                token.write(creds.to_json())
        else:
            print("[*] Token YouTube aggiornato in memoria; il secret GitHub resta invariato.")
            
    return googleapiclient.discovery.build("youtube", "v3", credentials=creds)

def upload_short(video_path, title, description):
    youtube = get_authenticated_service()
    if not youtube:
        return False
        
    print(f"[*] Avvio caricamento su YouTube Shorts: {video_path}")
    
    # Blocco anti-spam: se abbiamo già pubblicato questo video oggi, saltiamo.
    history_file = "history.json"
    if os.path.exists(history_file):
        try:
            with open(history_file, "r", encoding="utf-8") as f:
                history = json.load(f)
                today = time.strftime("%Y-%m-%d")
                metadata = {}
                if os.path.exists("reel_data.json"):
                    with open("reel_data.json", "r", encoding="utf-8") as meta_f:
                        metadata = json.load(meta_f)
                check_title = metadata.get("cover_title", title)
                
                # Controlla se c'è un video con lo stesso titolo caricato oggi
                for record in history:
                    if record.get("date") == today and record.get("title") == check_title:
                        print(f"[*] ATTENZIONE: Un video con titolo '{check_title}' è già stato pubblicato oggi su YouTube. Salto la pubblicazione per evitare doppioni!")
                        return True # Ritorna True per non far fallire lo script, ma non pubblica nulla.
        except Exception as e:
            print(f"[!] Errore lettura storico per anti-spam: {e}")
    
    # Crea la richiesta inserendo nel titolo anche #Shorts
    request = youtube.videos().insert(
        part="snippet,status",
        body={
          "snippet": {
            "categoryId": "22", # 22 = People & Blogs, 27 = Education
            "description": description,
            "title": f"{title} #shorts",
            "tags": ["shorts", "neatx", "automazione", "business"]
          },
          "status": {
            "privacyStatus": "public",
            "selfDeclaredMadeForKids": False
          }
        },
        media_body=MediaFileUpload(video_path, chunksize=-1, resumable=True)
    )
    
    try:
        response = request.execute()
        print(f"[+] VIDEO PUBBLICATO CON SUCCESSO SU YOUTUBE!")
        print(f"URL: https://www.youtube.com/watch?v={response['id']}")
        return response['id']
    except googleapiclient.errors.HttpError as e:
        print(f"[!] Si è verificato un errore HTTP {e.resp.status}:\n{e.content}")
        return None

if __name__ == "__main__":
    # Test diretto se eseguito manualmente
    print("Inizializzazione test autenticazione YouTube...")
    get_authenticated_service()
    print("Autenticazione funzionante!")
