import os
import asyncio
import glob
import math
import re
import unicodedata
from moviepy.editor import VideoFileClip, VideoClip, AudioFileClip, TextClip, CompositeVideoClip, clips_array, ImageClip, vfx, concatenate_videoclips
import edge_tts
import numpy as np
from PIL import Image, ImageDraw

# Patch per Pillow >= 10.0.0 usato da MoviePy
if not hasattr(Image, 'ANTIALIAS'):
    Image.ANTIALIAS = Image.LANCZOS

# ==========================================
# CONFIGURAZIONE DEL REEL (Target: Fisioterapista / Osteopata)
# Formato: SPLIT-SCREEN (ADHD Retention)
# ==========================================

VOICE = "it-IT-ElsaNeural" 

import json
import random
import hashlib
import time
import datetime
import requests
from dotenv import load_dotenv

load_dotenv()

data = {}
if os.path.exists("reel_data.json"):
    with open("reel_data.json", "r", encoding="utf-8") as f:
        data = json.load(f)

SCRIPT_TEXT = data.get("script_text", "Testo di default in assenza del file json...")
HOOK_TEXT = data.get("hook_text", "Hook di default")
NICHE = data.get("niche", "Centro Estetico di Lusso")
IMAGE_PROMPT = data.get("image_prompt", "")
GAMEPLAY_STYLE = data.get("gameplay_style", "runner")

OUTPUT_FILENAME = "reel_splitscreen.mp4"

# Dimensioni target per un Reel di Instagram/TikTok
REEL_WIDTH = 1080
REEL_HEIGHT = 1920

# ==========================================
# FUNZIONI
# ==========================================

def genera_voce_ai(testo):
    print(f"[*] Generazione voce AI e sottotitoli in corso con '{VOICE}'...")
    import subprocess
    cmd = [
        "python", "-m", "edge_tts",
        "--text", testo,
        "--voice", VOICE,
        "--write-media", "assets/voiceover.mp3",
        "--write-subtitles", "assets/subtitles.vtt"
    ]
    subprocess.run(cmd, check=True)
    print("[+] Audio e sottotitoli generati con successo!")
    
    # Riformatta i sottotitoli per lo stile TikTok (parola per parola)
    split_vtt_to_tiktok_style("assets/subtitles.vtt")

def split_vtt_to_tiktok_style(filepath):
    import re
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    blocks = content.strip().split('\n\n')
    new_blocks = []
    block_idx = 1
    
    for block in blocks:
        lines = block.split('\n')
        if len(lines) >= 3:
            time_line = lines[1]
            text = ' '.join(lines[2:])
            
            match = re.match(r'(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})', time_line)
            if not match:
                continue
                
            start_str, end_str = match.groups()
            
            def str_to_ms(s):
                h, m, s_ms = s.split(':')
                sec, ms = s_ms.split(',')
                return int(h)*3600000 + int(m)*60000 + int(sec)*1000 + int(ms)
                
            def ms_to_str(ms):
                h = int(ms / 3600000)
                ms = ms % 3600000
                m = int(ms / 60000)
                ms = ms % 60000
                s = int(ms / 1000)
                ms = ms % 1000
                return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'
                
            start_ms = str_to_ms(start_str)
            end_ms = str_to_ms(end_str)
            duration = end_ms - start_ms
            
            words = text.split()
            if not words:
                continue
                
            chunks = []
            for i in range(0, len(words), 2):
                chunks.append(' '.join(words[i:i+2]))
                
            total_chars = sum(len(c) for c in chunks)
            
            current_start = start_ms
            for chunk in chunks:
                if total_chars == 0:
                    chunk_dur = duration
                else:
                    chunk_dur = int(duration * (len(chunk) / total_chars))
                current_end = current_start + chunk_dur
                
                new_blocks.append(f'{block_idx}\n{ms_to_str(current_start)} --> {ms_to_str(current_end)}\n{chunk}')
                block_idx += 1
                current_start = current_end
                
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write('\n\n'.join(new_blocks) + '\n')

def resize_and_crop(clip, target_width, target_height):
    """Ridimensiona e ritaglia una clip per riempire esattamente le dimensioni target."""
    clip_ratio = clip.w / clip.h
    target_ratio = target_width / target_height
    
    if clip_ratio > target_ratio:
        # La clip è troppo larga, ridimensiona in base all'altezza e poi taglia i lati
        resized = clip.resize(height=target_height)
        return resized.crop(x_center=resized.w/2, width=target_width)
    else:
        # La clip è troppo stretta, ridimensiona in base alla larghezza e poi taglia sopra/sotto
        resized = clip.resize(width=target_width)
        return resized.crop(y_center=resized.h/2, height=target_height)

def slugify_topic(value):
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "_", normalized.lower()).strip("_")
    return slug or "generico"

# Mappa feature -> scena in inglese (usata per riflettere il senso del video)
FEATURE_SCENES_EN = {
    "no_show": "a smartphone showing a confirmed appointment with a paid deposit, a calendar with the time slot marked as paid and locked, a calm professional in the background",
    "booking": "a client booking an appointment by themselves on a smartphone app while the professional is free and not on the phone, a clean modern booking screen",
    "timesheet": "a digital timesheet dashboard on a screen showing staff shifts and a ready CSV file for the accountant, no paper or spreadsheets",
    "recensioni": "a 5-star Google review notification appearing on a smartphone right after an appointment, a happy satisfied client",
    "promemoria": "a WhatsApp reminder notification on a smartphone about an upcoming appointment, a client who will not forget",
    "analytics": "a real-time analytics dashboard on a screen with revenue charts and performance metrics, a professional reading the numbers",
    "multi_staff": "separate agendas for multiple staff members on a screen with organized shifts and assignments, a calm coordinated team",
}

# Parole chiave (in italiano, lowercase) che attivano una feature specifica
FEATURE_KEYWORDS = [
    ("no_show", ["no_show", "acconto", "no-show"]),
    ("booking", ["booking", "prenota", "24 ore su 24", "agenda"]),
    ("timesheet", ["timesheet", "excel", "turni", "commercialista"]),
    ("recensioni", ["recensioni", "google", "recensione"]),
    ("promemoria", ["promemoria", "whatsapp", "promemoria", "dimentica"]),
    ("analytics", ["analytics", "statistiche", "incassi", "guadagni", "dati"]),
    ("multi_staff", ["multi_staff", "staff", "collaboratori", "team"]),
]

# Descrizione inglese dell'ambiente di lavoro per ogni nicchia (riusa i prompt esistenti)
ENV_DESCR_BY_KEYWORD = {
    "parrucch": "modern Italian hair salon",
    "estetic": "modern beauty salon",
    "fisioterap": "modern physiotherapy clinic",
    "osteopat": "osteopathy studio",
    "massaggi": "massage therapy studio",
    "psicolog": "psychologist office",
    "nutrizion": "nutritionist studio",
    "personal trainer": "modern gym",
    "avvocat": "law office",
    "commercialist": "accountant office",
}

def prompt_immagine_per_nicchia(nicchia, script_text=None, hook_text=None):
    if IMAGE_PROMPT:
        return IMAGE_PROMPT

    topic = nicchia.lower()

    # Rileva la feature dal testo (script + hook)
    testo = f"{script_text or ''} {hook_text or ''}".lower()
    feature_rilevata = None
    for feature, keywords in FEATURE_KEYWORDS:
        if any(kw in testo for kw in keywords):
            feature_rilevata = feature
            break

    if feature_rilevata:
        # Ambiente di lavoro in inglese (default generico se nicchia sconosciuta)
        env_descr = None
        for keyword, descr in ENV_DESCR_BY_KEYWORD.items():
            if keyword in topic:
                env_descr = descr
                break
        if env_descr is None:
            env_descr = f"{nicchia} workplace"

        # Frase soggetto di base già presente nei prompt di nicchia
        base_subject = None
        subject_map = [
            ("parrucch", "professional hairdresser cutting and styling a client's hair"),
            ("estetic", "esthetician preparing a facial treatment for a client"),
            ("fisioterap", "physiotherapist helping a patient during rehabilitation exercises"),
            ("osteopat", "osteopath treating a patient on a therapy bed"),
            ("massaggi", "professional massage therapist working with a client"),
            ("psicolog", "therapist in a calm consultation room with a client"),
            ("nutrizion", "nutritionist consulting a client with a healthy food plan and tablet"),
            ("personal trainer", "personal trainer coaching a client in a modern gym"),
            ("avvocat", "professional lawyer consulting a client at a desk with documents"),
            ("commercialist", "commercialista consulting a client with laptop and tax documents"),
        ]
        for keyword, subject in subject_map:
            if keyword in topic:
                base_subject = subject
                break
        if base_subject is None:
            base_subject = f"professional {nicchia} working with a real client"

        return (
            f"photorealistic cinematic scene inside a {env_descr} workplace: "
            f"{FEATURE_SCENES_EN[feature_rilevata]}, {base_subject}, "
            f"premium realistic lighting, shallow depth of field"
        )

    prompts = [
        ("parrucch", "modern Italian hair salon, professional hairdresser cutting and styling a client's hair, elegant mirrors, salon chairs, realistic documentary photo"),
        ("estetic", "modern beauty salon, esthetician preparing a facial treatment for a client, clean luxury treatment room, realistic documentary photo"),
        ("fisioterap", "modern physiotherapy clinic, physiotherapist helping a patient during rehabilitation exercises, medical gym equipment, realistic documentary photo"),
        ("osteopat", "osteopathy studio, osteopath treating a patient on a therapy bed, calm professional clinic, realistic documentary photo"),
        ("massaggi", "massage therapy studio, professional massage therapist working with a client, warm spa treatment room, realistic documentary photo"),
        ("psicolog", "psychologist office, therapist in a calm consultation room with a client, modern professional studio, realistic documentary photo"),
        ("nutrizion", "nutritionist studio, nutritionist consulting a client with healthy food plan and tablet, modern office, realistic documentary photo"),
        ("personal trainer", "personal trainer coaching a client in a modern gym, fitness equipment, dynamic realistic documentary photo"),
        ("avvocat", "law office, professional lawyer consulting a client at a desk with documents, modern Italian studio, realistic documentary photo"),
        ("commercialist", "accountant office, commercialista consulting a client with laptop and tax documents, modern professional studio, realistic documentary photo"),
    ]
    for keyword, prompt in prompts:
        if keyword in topic:
            return prompt
    return f"professional {nicchia} working with a real client in a modern workplace, realistic documentary photo, highly detailed"

def _valida_immagine_jpeg(img_data):
    # Verifica che sia una vera immagine JPEG e di dimensione minima
    if not img_data or len(img_data) < 5 * 1024:
        return False
    return img_data[:3] == b'\xff\xd8\xff'

def genera_immagine_ai(nicchia):
    os.makedirs("assets", exist_ok=True)
    
    # --- INTEGRAZIONE IMMAGINI PREMIUM ---
    premium_dir = "assets/premium_images"
    if os.path.exists(premium_dir):
        premium_images = glob.glob(f"{premium_dir}/*.jpg")
        if premium_images:
            topic = nicchia.lower()
            matched_images = []
            if "parrucch" in topic or "barbier" in topic:
                matched_images = [
                    img for img in premium_images
                    if "barber" in img.lower() or "parrucch" in img.lower()
                ]
            elif "estetic" in topic:
                matched_images = [img for img in premium_images if "estetista" in img.lower() or "nail" in img.lower()]
            elif "fisioterap" in topic or "osteopat" in topic:
                matched_images = [
                    img for img in premium_images
                    if "fisioterapista" in img.lower() or "osteopat" in img.lower()
                ]
            elif "massaggi" in topic:
                matched_images = [
                    img for img in premium_images
                    if "massaggi" in img.lower() or "massage" in img.lower()
                ]
            elif "tatuat" in topic:
                matched_images = [img for img in premium_images if "tatuatore" in img.lower()]
            elif "personal trainer" in topic or "palestr" in topic:
                matched_images = [img for img in premium_images if "personal_trainer" in img.lower()]
            elif "psicolog" in topic:
                matched_images = [img for img in premium_images if "psicologo" in img.lower()]
            elif "nutrizion" in topic:
                matched_images = [img for img in premium_images if "nutrizionista" in img.lower()]
            elif "commercialist" in topic or "avvocat" in topic:
                matched_images = [img for img in premium_images if "commercialista" in img.lower()]
            elif "prompt" in topic or "volantin" in topic or "marketing" in topic:
                matched_images = [img for img in premium_images if "prompt" in img.lower()]
            
            # Per garantire sempre varietà (un'immagine diversa a ogni reel), uniamo l'immagine 
            # specifica della nicchia con le foto generiche dell'app (dashboard, prenotazioni, ecc.)
            generic_images = [img for img in premium_images if "dashboard" in img.lower() or "prenota" in img.lower() or "roi" in img.lower() or "notifica" in img.lower() or "prima_dopo" in img.lower()]
            
            if matched_images:
                matched_images.extend(generic_images)
            else:
                matched_images = generic_images
            
            if matched_images:
                import random
                chosen = random.choice(matched_images)
                print(f"[*] Utilizzo immagine PREMIUM AI: {chosen}")
                return chosen
    # -------------------------------------
    
    prompt = prompt_immagine_per_nicchia(nicchia, script_text=SCRIPT_TEXT, hook_text=HOOK_TEXT)
    oggi = datetime.datetime.now().strftime("%Y-%m-%d")
    # Hash breve e univoco del prompt: evita nomi file troppo lunghi (limite 255/260 byte)
    # che facevano fallire open() e ripiegavano sull'immagine nera
    slug = hashlib.sha256(prompt.encode("utf-8")).hexdigest()[:16]
    percorso_img = f"assets/niche_img_{oggi}_{slug}.jpg"
    
    for vecchio in glob.glob(f"assets/niche_img_*_{slug}.jpg"):
        if vecchio != percorso_img:
            try:
                os.remove(vecchio)
            except OSError:
                pass
    
    if os.path.exists(percorso_img):
        print("[*] Immagine AI di oggi già presente. Salto la generazione.")
        return percorso_img
         
    print(f"[*] Generazione immagine 4K per la nicchia: {nicchia} (tramite AI Gratuita)...")
    try:
        import urllib.parse
        safe_prompt = urllib.parse.quote(prompt)

        # Seed stabile derivato dal prompt + data: la stessa scena produce immagini coerenti,
        # ma ogni giorno (e ogni contenuto diverso) ottiene una varietà diversa
        seed_base = int(hashlib.sha256(f"{prompt}{oggi}".encode()).hexdigest(), 16) % 10_000_000_000

        # Parametri reali supportati dall'API: enhance (pertinenza prompt),
        # seed (riproducibilità), width/height (verticale 9:16), nologo (nessun watermark)
        img_data = None
        for tentativo in range(3):
            seed_corrente = seed_base + tentativo  # seed diverso ad ogni retry
            url = (
                f"https://image.pollinations.ai/prompt/{safe_prompt}"
                f"?width=1080&height=1920&nologo=true&enhance=true&seed={seed_corrente}"
            )
            try:
                response = requests.get(url, timeout=120)
                response.raise_for_status()
                contenuto = response.content
                if _valida_immagine_jpeg(contenuto):
                    img_data = contenuto
                    break
                else:
                    print(f"[!] Tentativo {tentativo + 1}: risposta non valida come JPEG, riprovo...")
            except Exception as e:
                print(f"[!] Tentativo {tentativo + 1} fallito: {e}")
            time.sleep(2)

        if img_data is None:
            raise RuntimeError("Generazione immagine non riuscita dopo 3 tentativi")

        with open(percorso_img, 'wb') as handler:
            handler.write(img_data)
        print("[+] Immagine AI generata e salvata con successo!")
    except Exception as e:
        print(f"[!] Errore durante la generazione dell'immagine AI: {e}")
        img = Image.new('RGB', (1080, 1920), color = (20, 20, 20))
        img.save(percorso_img)
        print("[!] Usata immagine nera di ripiego.")
        
    return percorso_img

def seleziona_video_gameplay_locale():
    patterns = [
        "assets/gameplay/*.mp4",
        "assets/*_bg.mp4",
        "assets/background*.mp4",
        "assets/satisfying*.mp4",
        "assets/app_demo*.mp4",
        "assets/*subway*.mp4",
        "assets/*minecraft*.mp4",
        "assets/*runner*.mp4",
        "assets/*gameplay*.mp4",
        "assets/*parkour*.mp4",
    ]
    candidates = []
    for pattern in patterns:
        candidates.extend(glob.glob(pattern))

    candidates = [path for path in sorted(set(candidates)) if os.path.getsize(path) > 0]
    if not candidates:
        return None
    return random.choice(candidates)

def draw_runner_frame(draw, t, width, height):
    draw.rectangle((0, 0, width, height), fill=(18, 26, 44))
    draw.rectangle((0, 0, width, int(height * 0.28)), fill=(32, 78, 130))
    draw.polygon([(0, height), (width, height), (650, 180), (430, 180)], fill=(44, 52, 72))

    for lane in [-1, 0, 1]:
        draw.line((width // 2 + lane * 45, 180, width // 2 + lane * 245, height), fill=(92, 104, 138), width=7)

    for i in range(16):
        y = int((i * 95 + t * 360) % (height + 120) - 60)
        scale = max(0.08, y / height)
        half = int(65 + 330 * scale)
        draw.line((width // 2 - half, y, width // 2 + half, y), fill=(76, 88, 118), width=5)

    for i in range(9):
        y = int((i * 150 + t * 430) % (height + 180) - 90)
        scale = max(0.12, y / height)
        lane = [-1, 0, 1][i % 3]
        x = int(width // 2 + lane * (55 + 190 * scale))
        radius = int(12 + 22 * scale)
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=(255, 205, 54), outline=(255, 245, 150), width=4)

    obstacle_y = int((t * 520) % (height + 180) - 90)
    obstacle_scale = max(0.14, obstacle_y / height)
    obstacle_x = int(width // 2 - 170 * obstacle_scale)
    obstacle_w = int(80 + 90 * obstacle_scale)
    obstacle_h = int(50 + 90 * obstacle_scale)
    draw.rounded_rectangle(
        (obstacle_x - obstacle_w, obstacle_y - obstacle_h, obstacle_x + obstacle_w, obstacle_y + obstacle_h),
        radius=12,
        fill=(238, 76, 80),
        outline=(255, 225, 225),
        width=4,
    )

    player_x = width // 2 + int(math.sin(t * 3.2) * 105)
    player_y = height - 135
    draw.ellipse((player_x - 34, player_y - 86, player_x + 34, player_y - 18), fill=(255, 220, 170))
    draw.rounded_rectangle((player_x - 48, player_y - 22, player_x + 48, player_y + 68), radius=22, fill=(38, 178, 255))
    draw.line((player_x - 36, player_y + 66, player_x - 78, player_y + 105), fill=(255, 240, 210), width=16)
    draw.line((player_x + 36, player_y + 66, player_x + 78, player_y + 105), fill=(255, 240, 210), width=16)

def draw_block_miner_frame(draw, t, width, height):
    draw.rectangle((0, 0, width, height), fill=(96, 178, 232))
    draw.ellipse((width - 210, 80, width - 90, 200), fill=(255, 235, 120))
    draw.polygon(((-80, 520), (260, 230), (620, 520)), fill=(84, 124, 110))
    draw.polygon(((360, 520), (760, 190), (1170, 520)), fill=(74, 112, 100))

    block = 90
    offset = int(t * 160) % block
    for row in range(6):
        y = height - (row + 1) * block
        for col in range(-1, width // block + 3):
            x = col * block - offset
            if row == 5:
                color = (68, 164, 74)
            elif row % 3 == 0:
                color = (128, 92, 52)
            elif row % 3 == 1:
                color = (104, 78, 48)
            else:
                color = (96, 96, 102)
            draw.rectangle((x, y, x + block, y + block), fill=color, outline=(40, 44, 52), width=3)

    bob = int(math.sin(t * 5) * 9)
    px = width // 2
    py = height - 365 + bob
    draw.rectangle((px - 45, py - 90, px + 45, py), fill=(52, 112, 220), outline=(18, 34, 70), width=4)
    draw.rectangle((px - 38, py - 154, px + 38, py - 88), fill=(205, 142, 96), outline=(60, 36, 24), width=4)
    draw.rectangle((px - 58, py - 42, px - 38, py + 58), fill=(48, 62, 96))
    draw.rectangle((px + 38, py - 42, px + 58, py + 58), fill=(48, 62, 96))
    swing = math.sin(t * 6)
    draw.line((px + 55, py - 65, px + 160, py - 130 + int(swing * 45)), fill=(92, 58, 34), width=10)
    draw.polygon(
        ((px + 150, py - 145 + int(swing * 45)), (px + 205, py - 128 + int(swing * 45)), (px + 168, py - 96 + int(swing * 45))),
        fill=(190, 196, 204),
    )

def draw_neon_racer_frame(draw, t, width, height):
    draw.rectangle((0, 0, width, height), fill=(7, 8, 24))
    horizon = int(height * 0.36)
    draw.line((0, horizon, width, horizon), fill=(0, 246, 255), width=5)
    draw.polygon(((160, height), (920, height), (610, horizon), (470, horizon)), fill=(20, 18, 48))

    for lane in [-2, -1, 0, 1, 2]:
        draw.line((width // 2 + lane * 32, horizon, width // 2 + lane * 185, height), fill=(255, 40, 215), width=4)

    for i in range(18):
        y = int(horizon + ((i * 55 + t * 310) % (height - horizon + 90)))
        scale = (y - horizon) / max(1, height - horizon)
        half = int(85 + 395 * scale)
        draw.line((width // 2 - half, y, width // 2 + half, y), fill=(0, 190, 255), width=3)

    for i in range(5):
        y = int((i * 185 + t * 470) % (height + 160) - 80)
        scale = max(0.18, y / height)
        lane = [-1, 1, 0, -1, 1][i]
        x = int(width // 2 + lane * (95 + 210 * scale))
        draw.rounded_rectangle((x - 70, y - 38, x + 70, y + 38), radius=10, fill=(255, 70, 105), outline=(255, 220, 235), width=4)

    car_x = width // 2 + int(math.sin(t * 2.4) * 130)
    car_y = height - 120
    draw.polygon(((car_x, car_y - 85), (car_x - 125, car_y + 45), (car_x + 125, car_y + 45)), fill=(255, 226, 72), outline=(255, 255, 255))
    draw.polygon(((car_x, car_y - 48), (car_x - 55, car_y + 28), (car_x + 55, car_y + 28)), fill=(30, 38, 82))

def genera_gameplay_sintetico(duration):
    width = REEL_WIDTH
    height = REEL_HEIGHT // 2
    style = (GAMEPLAY_STYLE or "runner").lower()
    print(f"[*] Creo gameplay sintetico stile: {style}")

    def make_frame(t):
        img = Image.new("RGB", (width, height), color=(12, 14, 28))
        draw = ImageDraw.Draw(img)
        if style == "block_miner":
            draw_block_miner_frame(draw, t, width, height)
        elif style == "neon_racer":
            draw_neon_racer_frame(draw, t, width, height)
        else:
            draw_runner_frame(draw, t, width, height)
        return np.array(img)

    return VideoClip(make_frame, duration=duration).set_fps(30)

def get_gameplay_clip(duration):
    gameplay_path = seleziona_video_gameplay_locale()
    if gameplay_path:
        print(f"[*] Uso gameplay locale: {gameplay_path}")
        clip = VideoFileClip(gameplay_path).without_audio()
        if clip.duration > duration + 15:
            max_start = max(15, clip.duration - duration - 0.1)
            start_t = random.uniform(15, max_start)
            clip = clip.subclip(start_t, start_t + duration)
        else:
            clip = clip.fx(vfx.loop, duration=duration)
        return resize_and_crop(clip, REEL_WIDTH, REEL_HEIGHT // 2)

    return genera_gameplay_sintetico(duration)

def zoom_in_effect(clip, zoom_ratio=0.04):
    """Applica un leggero effetto zoom in (Ken Burns) su una ImageClip"""
    def effect(get_frame, t):
        img = Image.fromarray(get_frame(t))
        base_size = img.size
        # Calcola il ritaglio dinamico
        zoom_factor = 1 + (zoom_ratio * (t / clip.duration))
        new_w = int(base_size[0] / zoom_factor)
        new_h = int(base_size[1] / zoom_factor)
        
        left = (base_size[0] - new_w) / 2
        top = (base_size[1] - new_h) / 2
        right = (base_size[0] + new_w) / 2
        bottom = (base_size[1] + new_h) / 2
        
        img = img.crop((left, top, right, bottom))
        img = img.resize(base_size, Image.LANCZOS)
        return __import__('numpy').array(img)
        
    return clip.fl(effect)

def seleziona_immagini_montaggio(nicchia, primary_path, count=4):
    premium_dir = "assets/premium_images"
    premium_images = []
    for pattern in ("*.jpg", "*.jpeg", "*.png", "*.webp"):
        premium_images.extend(glob.glob(os.path.join(premium_dir, pattern)))

    premium_images = sorted(set(path for path in premium_images if os.path.getsize(path) > 0))
    if not premium_images:
        return [primary_path]

    topic = nicchia.lower()
    keyword_groups = [
        (("parrucch", "barbier"), ("barber", "parrucch")),
        (("estetic", "nail"), ("estetista", "nail")),
        (("fisioterap", "osteopat"), ("fisioterapista", "osteopat")),
        (("massaggi",), ("massaggiatore", "massage")),
        (("tatuat",), ("tatuatore", "tattoo")),
        (("personal trainer", "palestr"), ("personal_trainer", "gym")),
        (("psicolog",), ("psicologo",)),
        (("nutrizion",), ("nutrizionista",)),
        (("commercialist", "avvocat"), ("commercialista", "avvocato")),
    ]

    relevant_tokens = ()
    for niche_tokens, filename_tokens in keyword_groups:
        if any(token in topic for token in niche_tokens):
            relevant_tokens = filename_tokens
            break

    relevant = [
        path for path in premium_images
        if relevant_tokens and any(token in os.path.basename(path).lower() for token in relevant_tokens)
    ]
    generic_tokens = ("dashboard", "prenota", "booking", "roi", "notifica", "prima_dopo")
    generic = [
        path for path in premium_images
        if any(token in os.path.basename(path).lower() for token in generic_tokens)
    ]

    rotation_path = os.path.join("logs", "visual_rotation.json")
    try:
        with open(rotation_path, "r", encoding="utf-8") as rotation_file:
            recent = json.load(rotation_file).get("recent", [])
    except (OSError, ValueError, AttributeError):
        recent = []

    recent_set = set(recent[-12:])
    primary_abs = os.path.abspath(primary_path)
    selected = [primary_path]

    def add_candidates(candidates, allow_recent=False):
        available = [
            path for path in candidates
            if os.path.abspath(path) != primary_abs
            and path not in selected
            and (allow_recent or os.path.basename(path) not in recent_set)
        ]
        random.shuffle(available)
        for path in available:
            if len(selected) >= count:
                break
            selected.append(path)

    for candidate_group in (relevant, generic, premium_images):
        add_candidates(candidate_group, allow_recent=False)
    if len(selected) < count:
        for candidate_group in (relevant, generic, premium_images):
            add_candidates(candidate_group, allow_recent=True)

    try:
        os.makedirs(os.path.dirname(rotation_path), exist_ok=True)
        updated_recent = (recent + [os.path.basename(path) for path in selected])[-12:]
        with open(rotation_path, "w", encoding="utf-8") as rotation_file:
            json.dump({"recent": updated_recent}, rotation_file, ensure_ascii=False, indent=2)
    except OSError as rotation_error:
        print(f"[!] Impossibile aggiornare la rotazione visual: {rotation_error}")

    return selected

def crea_montaggio_immagini(paths, duration):
    usable_paths = [path for path in paths if os.path.exists(path) and os.path.getsize(path) > 0]
    if not usable_paths:
        raise RuntimeError("Nessuna immagine disponibile per il montaggio")

    segment_duration = duration / len(usable_paths)
    segments = []
    for index, path in enumerate(usable_paths):
        segment = ImageClip(path).set_duration(segment_duration)
        segment = resize_and_crop(segment, REEL_WIDTH, REEL_HEIGHT // 2)
        segment = zoom_in_effect(segment, zoom_ratio=0.045 + (index % 3) * 0.02)
        segments.append(segment)

    print(f"[*] Creo {len(segments)} micro-clip visuali senza audio, sincronizzate con il parlato.")
    return concatenate_videoclips(segments, method="compose").set_duration(duration)

def crea_video():
    print("[*] Montaggio video SPLIT-SCREEN in corso...")
    
    audio_clip = AudioFileClip("assets/voiceover.mp3")
    duration = audio_clip.duration
    
    # 1. Meta superiore: gameplay locale se presente, altrimenti gameplay sintetico.
    clip_top = get_gameplay_clip(duration)

    # 2. Carica l'immagine generata dall'AI (Metà Inferiore)
    path_app = genera_immagine_ai(NICHE)
    
    montage_paths = seleziona_immagini_montaggio(NICHE, path_app, count=4)
    clip_bottom = crea_montaggio_immagini(montage_paths, duration)

    # 3. Unisce i due video (Split-Screen Array)
    final_bg = clips_array([[clip_top], [clip_bottom]])
    final_bg = final_bg.set_audio(audio_clip)

    # 4. Testo Hook (Primi 4 secondi al centro dello schermo)
    try:
        txt_hook = TextClip(HOOK_TEXT, fontsize=90, color='white', bg_color='#0066FF', font='Arial-Bold', method='caption', size=(REEL_WIDTH - 150, None))
        txt_hook = txt_hook.set_position('center').set_duration(4).crossfadeout(0.5)
    except:
        txt_hook = None

    # Sovrapposizione del testo sul video diviso a metà
    clips_finali = [final_bg]
    if txt_hook:
        clips_finali.append(txt_hook)
    
    video_finale = CompositeVideoClip(clips_finali)
    
    print(f"[*] Esportazione del video temporaneo in {OUTPUT_FILENAME}...")
    video_finale.write_videofile(
        OUTPUT_FILENAME,
        fps=30,  # 30 fps
        codec="libx264",
        audio_codec="aac",
        threads=4,
        remove_temp=False
    )
    
    # Rilascia i file aperti per Windows
    video_finale.close()
    final_bg.close()
    
    # Sovrimpressione sottotitoli con FFmpeg
    print("[*] Sovrimpressione dei sottotitoli in corso (FFmpeg)...")
    import imageio_ffmpeg
    import subprocess
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    
    subbed_filename = OUTPUT_FILENAME.replace(".mp4", "_subbed.mp4")
    # Stile dei sottotitoli: Giallo acceso, bordo nero, grassetto, in basso al centro
    sub_style = "FontSize=26,PrimaryColour=&H0000FFFF,OutlineColour=&H00000000,BorderStyle=3,Outline=3,Shadow=0,MarginV=120,Bold=1"
    
    cmd = [
        ffmpeg_exe, "-y",
        "-i", OUTPUT_FILENAME,
        "-vf", f"subtitles=assets/subtitles.vtt:force_style='{sub_style}'",
        "-c:a", "copy",
        subbed_filename
    ]
    subprocess.run(cmd, check=True)
    
    # Lasciamo il video come reel_splitscreen_subbed.mp4 per evitare i lock di Windows
    
    print("[+] Finito! Video pronto con sottotitoli in reel_splitscreen_subbed.mp4.")
    
    # Genera la copertina grafica dedicata isolata per evitare crash con MoviePy
    print("[*] Estrazione della copertina HD...")
    try:
        title = data.get("cover_title", "NEATX\nAPP PRENOTAZIONI")
        subprocess.run(["python", "create_cover.py", title], check=True)
    except Exception as e:
        print(f"[!] Errore generazione copertina grafica: {e}")
        fallback = Image.new("RGB", (REEL_WIDTH, REEL_HEIGHT), color=(5, 8, 20))
        fallback.save("assets/cover.png")
        fallback.save("assets/cover.jpg", "JPEG", quality=94)
        print("[!] Creata copertina di ripiego.")
    
    print("[+] Finito! Video pronto.")

if __name__ == "__main__":
    if not os.path.exists("assets"):
        os.makedirs("assets")
        
    audio_path = "assets/voiceover.mp3"
    genera_voce_ai(SCRIPT_TEXT)
    crea_video()
