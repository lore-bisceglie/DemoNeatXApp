import os
import random
import time
from instagrapi import Client

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

SESSION_FILE = "session_cacciatore.json"
PROCESSED_FILE = "cacciatore_seen.txt"

TARGET_HASHTAGS = [
    "barbiereitaliano",
    "parrucchiere",
    "estetista",
    "nailsitalia",
    "onicotecnica",
    "laserdiodo",
    "fisioterapista",
    "osteopata",
    "nutrizionista",
    "massaggiatore",
    "personaltraineritalia",
    "palestra",
    "insegnanteyoga",
    "pilatesitalia",
    "tatuatoreitaliano",
    "tattoostudio",
    "fotografoitalia",
    "psicologo",
]


def env_int(name, default):
    try:
        return int(os.environ.get(name, default))
    except ValueError:
        return default


def env_float(name, default):
    try:
        return float(os.environ.get(name, default))
    except ValueError:
        return default


MAX_PROFILES_PER_RUN = env_int("CACCIATORE_MAX_PROFILES", 3)
MIN_PAUSE_SECONDS = env_int("CACCIATORE_MIN_PAUSE_SECONDS", 55)
MAX_PAUSE_SECONDS = env_int("CACCIATORE_MAX_PAUSE_SECONDS", 140)
MAX_STORIES_PER_USER = env_int("CACCIATORE_MAX_STORIES_PER_USER", 1)
STORY_LIKE_PROBABILITY = env_float("CACCIATORE_STORY_LIKE_PROBABILITY", 0.75)

ENABLE_POST_LIKE = os.environ.get("CACCIATORE_POST_LIKE", "true").lower() != "false"
ENABLE_STORY_VIEW = os.environ.get("CACCIATORE_STORY_VIEW", "true").lower() != "false"
ENABLE_STORY_LIKE = os.environ.get("CACCIATORE_STORY_LIKE", "true").lower() != "false"


def load_processed():
    if not os.path.exists(PROCESSED_FILE):
        return set()
    with open(PROCESSED_FILE, "r", encoding="utf-8") as f:
        return {line.strip() for line in f if line.strip()}


def save_processed(media_id):
    with open(PROCESSED_FILE, "a", encoding="utf-8") as f:
        f.write(f"{media_id}\n")


def human_pause(min_seconds=None, max_seconds=None):
    min_seconds = MIN_PAUSE_SECONDS if min_seconds is None else min_seconds
    max_seconds = MAX_PAUSE_SECONDS if max_seconds is None else max_seconds
    wait = random.randint(min_seconds, max_seconds)
    print(f"   Pausa umana di {wait} secondi...")
    time.sleep(wait)


def login_instagram():
    cl = Client()
    cl.delay_range = [2, 5]

    if os.path.exists(SESSION_FILE):
        print("Caricamento sessione Instagram salvata...")
        cl.load_settings(SESSION_FILE)
        try:
            cl.get_timeline_feed()
            print("Login effettuato tramite sessione.")
            return cl
        except Exception as e:
            print(f"Sessione scaduta: {e}. Effettuo nuovo login...")

    username = os.environ.get("INSTA_USER", "")
    password = os.environ.get("INSTA_PASS", "")

    if not username or not password:
        print("ERRORE: INSTA_USER e INSTA_PASS mancanti nei Secrets o nel file .env.")
        return None

    try:
        print("Effettuo il login...")
        cl.login(username, password)
        cl.dump_settings(SESSION_FILE)
        print("Login effettuato e sessione salvata.")
        return cl
    except Exception as e:
        print(f"Errore durante il login: {e}")
        return None


def interact_with_profile(cl, media):
    media_id = str(media.id)
    user_id = media.user.pk
    username = media.user.username

    if username.lower() == os.environ.get("INSTA_USER", "").lower():
        print("   Salto il profilo NeatX.")
        return False

    print(f"Profilo agganciato: @{username}")

    if ENABLE_POST_LIKE:
        try:
            cl.media_like(media.id)
            print(f"   Like lasciato sul post di @{username}.")
            human_pause(8, 18)
        except Exception as e:
            print(f"   Like post non riuscito su @{username}: {e}")

    try:
        stories = cl.user_stories(user_id)
    except Exception as e:
        print(f"   Storie non leggibili per @{username}: {e}")
        stories = []

    stories = stories[:MAX_STORIES_PER_USER]
    if not stories:
        print(f"   Nessuna storia attiva per @{username}.")
        save_processed(media_id)
        return True

    story_ids = [story.id for story in stories]

    if ENABLE_STORY_VIEW:
        try:
            cl.story_seen(story_ids)
            print(f"   Storie viste per @{username}.")
            human_pause(6, 14)
        except Exception as e:
            print(f"   Vista storie non riuscita per @{username}: {e}")

    if ENABLE_STORY_LIKE:
        for story in stories:
            if random.random() > STORY_LIKE_PROBABILITY:
                print(f"   Like storia saltato per naturalezza su @{username}.")
                continue
            try:
                cl.story_like(story.id)
                print(f"   Like lasciato alla storia di @{username}.")
                human_pause(8, 18)
            except Exception as e:
                print(f"   Like storia non riuscito per @{username}: {e}")

    save_processed(media_id)
    return True


def cacciatore_silenzioso(cl):
    print("")
    print("CACCIATORE SILENZIOSO ATTIVO")
    print("Obiettivo: lasciare notifiche leggere su profili professionali in target.")
    print(f"Limite run: {MAX_PROFILES_PER_RUN} profili.")

    hashtag = random.choice(TARGET_HASHTAGS)
    print(f"Scansione hashtag: #{hashtag}")

    processed = load_processed()
    visited = 0

    try:
        medias = cl.hashtag_medias_recent(hashtag, amount=20)
    except Exception as e:
        print(f"Errore durante la scansione hashtag: {e}")
        return

    for media in medias:
        media_id = str(media.id)
        if media_id in processed:
            continue

        if interact_with_profile(cl, media):
            visited += 1

        if visited >= MAX_PROFILES_PER_RUN:
            break

        human_pause()

    print("")
    print(f"Caccia completata. Profili lavorati: {visited}.")


def main():
    cl = login_instagram()
    if not cl:
        return

    cacciatore_silenzioso(cl)


if __name__ == "__main__":
    main()
