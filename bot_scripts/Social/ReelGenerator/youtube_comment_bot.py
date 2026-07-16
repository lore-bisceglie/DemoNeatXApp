import os
import json
import time
import random
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from dotenv import load_dotenv

load_dotenv()

SCOPES = ["https://www.googleapis.com/auth/youtube.force-ssl"]
TOKEN_FILE = "token.json"

TRIGGER_WORDS = [
    "info", "prezzo", "costo", "link", "demo", "provare",
    "funziona", "come si fa", "interessato", "voglio", "aiuto",
    "neatx", "appuntament", "prenot", "prova", "gratis",
    "funzione", "come funziona", "whatsapp", "prezzi", "costa",
    "quanto", "agenda", "scopri", "contatt",
]

REPLY_TEMPLATES = [
    "Grazie per l'interesse! Per una demo personalizzata visita neatx.store. Ah, se hai problemi con i social, abbiamo anche creato 'L'Arsenale dei Prompt': 50 post pronti per ChatGPT! Scaricali qui: https://tinyurl.com/neatxprompt",
    "Ciao! Trovi la demo gratuita in descrizione. Nel frattempo, se vuoi svoltare sui social in 3 minuti, scarica il nostro 'L'Arsenale dei Prompt' (50 template copia-incolla) a questo link: https://tinyurl.com/neatxprompt",
    "Grazie! Visita neatx.store per la demo. Inoltre, per i tuoi social, non perderti i nostri 50 Prompt copia-incolla pensati per i saloni: https://tinyurl.com/neatxprompt",
]

PROCESSED_FILE = "youtube_replied.json"

def get_service():
    creds = None
    token_json = os.environ.get("YOUTUBE_TOKEN_JSON")
    if token_json:
        try:
            creds = Credentials.from_authorized_user_info(json.loads(token_json), SCOPES)
        except Exception as e:
            print(f"[!] Errore YOUTUBE_TOKEN_JSON: {e}")

    if not creds and os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
            except Exception as e:
                print(f"[!] Errore refresh token: {e}")
                creds = None
        if not creds:
            print("[!] Token YouTube non valido o scaduto.")
            print("    Il token corrente ha solo scope youtube.upload.")
            print("    Per rispondere ai commenti serve:")
            print("    1. In youtube_uploader.py, cambia SCOPES in:")
            print("       SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl']")
            print("    2. Esegui localmente: python youtube_uploader.py")
            print("       (anche se fallisce l'upload, rigenererà token.json con gli scope giusti)")
            print("    3. Ricarica YOUTUBE_TOKEN_JSON su GitHub/Vercel con il nuovo token.json")
            return None

    return build("youtube", "v3", credentials=creds)

def load_processed():
    if os.path.exists(PROCESSED_FILE):
        try:
            with open(PROCESSED_FILE, "r") as f:
                return set(json.load(f))
        except:
            return set()
    return set()

def save_processed(processed):
    with open(PROCESSED_FILE, "w") as f:
        json.dump(list(processed), f)

def get_channel_id(service):
    request = service.channels().list(part="id", mine=True)
    response = request.execute()
    if response.get("items"):
        return response["items"][0]["id"]
    return None

def get_latest_video(service, channel_id):
    request = service.search().list(
        part="id",
        channelId=channel_id,
        order="date",
        maxResults=1,
        type="video"
    )
    response = request.execute()
    if response.get("items"):
        return response["items"][0]["id"]["videoId"]
    return None

def get_comments(service, video_id):
    comments = []
    request = service.commentThreads().list(
        part="snippet",
        videoId=video_id,
        maxResults=100,
        order="relevance"
    )
    while request:
        response = request.execute()
        for item in response.get("items", []):
            snippet = item["snippet"]["topLevelComment"]["snippet"]
            comments.append({
                "id": item["id"],
                "author": snippet["authorDisplayName"],
                "text": snippet["textOriginal"],
                "reply_count": item["snippet"]["totalReplyCount"],
            })
        request = service.commentThreads().list_next(request, response)
    return comments

def reply_to_comment(service, comment_id, text):
    request = service.comments().insert(
        part="snippet",
        body={
            "snippet": {
                "parentId": comment_id,
                "textOriginal": text,
            }
        }
    )
    response = request.execute()
    return response

def main():
    print("[*] Avvio YouTube Comment Bot...")
    service = get_service()
    if not service:
        return

    processed = load_processed()

    channel_id = get_channel_id(service)
    if not channel_id:
        print("[!] Nessun canale trovato.")
        return
    print(f"[*] Canale ID: {channel_id}")

    video_id = get_latest_video(service, channel_id)
    if not video_id:
        print("[!] Nessun video trovato.")
        return
    print(f"[*] Ultimo video: {video_id}")

    comments = get_comments(service, video_id)
    print(f"[*] Trovati {len(comments)} commenti.")

    replied = 0
    for comment in comments:
        if comment["id"] in processed:
            continue
        if comment["reply_count"] > 0:
            processed.add(comment["id"])
            continue

        text_lower = comment["text"].lower()
        matched = [w for w in TRIGGER_WORDS if w in text_lower]
        if matched:
            print(f"  [+] Match: @{comment['author']} ('{', '.join(matched)}'): {comment['text'][:60]}...")
            reply_text = random.choice(REPLY_TEMPLATES)
            try:
                reply_to_comment(service, comment["id"], reply_text)
                print(f"    -> Risposto!")
                replied += 1
                processed.add(comment["id"])
                time.sleep(3)
            except HttpError as e:
                print(f"    [!] Errore API: {e}")
                # Se errore 403 (quota/quota), fermiamo tutto
                if e.resp.status == 403:
                    break

        processed.add(comment["id"])

    save_processed(processed)
    print(f"[*] Fatto! {replied} risposte inviate.")

if __name__ == "__main__":
    main()
