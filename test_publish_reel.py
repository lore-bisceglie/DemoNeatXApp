import os
import sys
from instagrapi import Client
import moviepy.editor as mp
import sys
sys.modules['moviepy'].VideoFileClip = mp.VideoFileClip

SESSION_ID = os.environ["INSTA_SESSION_ID"]

def publish_reel(video_path, caption):
    cl = Client()
    try:
        cl.login_by_sessionid(SESSION_ID)
        print("✅ Accesso a Instagram effettuato con successo tramite cookie!")
        
        print(f"🎬 Caricamento del Reel ({video_path}) in corso...")
        # L'estensione deve essere mp4.
        media = cl.clip_upload(
            video_path,
            caption
        )
        print("🚀 Reel pubblicato con successo su Instagram!")
        print(media.dict())
        return media.dict()
    except Exception as e:
        print(f"❌ Errore durante la pubblicazione del Reel: {e}")
        return None

if __name__ == "__main__":
    video_path = r"C:\Users\Lxxmtq\Documents\Korsakoff\NeatX\DemoNeatXApp\bot_scripts\Social\ReelGenerator\Reels_Finiti\Reel_Fisioterapista_20260704_1202.mp4"
    caption = "Test di automazione NeatX! 🔥 #NeatX #Automazione"
    publish_reel(video_path, caption)
