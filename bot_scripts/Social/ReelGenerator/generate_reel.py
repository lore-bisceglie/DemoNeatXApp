import os
import asyncio
import glob
import math
import re
import unicodedata
from moviepy.editor import VideoFileClip, VideoClip, AudioFileClip, TextClip, CompositeVideoClip, clips_array, ImageClip, vfx
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

def prompt_immagine_per_nicchia(nicchia):
    if IMAGE_PROMPT:
        return IMAGE_PROMPT

    topic = nicchia.lower()
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

def genera_immagine_ai(nicchia):
    os.makedirs("assets", exist_ok=True)
    percorso_img = f"assets/niche_bg_{slugify_topic(nicchia)}.jpg"
    if os.path.exists(percorso_img):
        print("[*] Immagine AI già presente. Salto la generazione.")
        return percorso_img
        
    print(f"[*] Generazione immagine 4K per la nicchia: {nicchia} (tramite AI Gratuita)...")
    try:
        import urllib.parse
        prompt = prompt_immagine_per_nicchia(nicchia)
        safe_prompt = urllib.parse.quote(prompt)
        url = f"https://image.pollinations.ai/prompt/{safe_prompt}?width=1080&height=1920&nologo=true"
        
        response = requests.get(url, timeout=90)
        response.raise_for_status()
        img_data = response.content
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

def crea_video():
    print("[*] Montaggio video SPLIT-SCREEN in corso...")
    
    audio_clip = AudioFileClip("assets/voiceover.mp3")
    duration = audio_clip.duration
    
    # 1. Meta superiore: gameplay locale se presente, altrimenti gameplay sintetico.
    clip_top = get_gameplay_clip(duration)

    # 2. Carica l'immagine generata dall'AI (Metà Inferiore)
    path_app = genera_immagine_ai(NICHE)
    
    # Crea una ImageClip e dalle la durata dell'audio
    clip_bottom = ImageClip(path_app).set_duration(duration)
    
    # Ridimensiona l'immagine per riempire la metà inferiore
    clip_bottom = resize_and_crop(clip_bottom, REEL_WIDTH, REEL_HEIGHT // 2)
    
    # Applica il Ken Burns (Slow Zoom) per dare movimento
    print("[*] Applicazione effetto Zoom Cinematografico sull'immagine...")
    clip_bottom = zoom_in_effect(clip_bottom, zoom_ratio=0.08)

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
        print("[!] Creata copertina di ripiego.")
    
    print("[+] Finito! Video pronto.")

if __name__ == "__main__":
    if not os.path.exists("assets"):
        os.makedirs("assets")
        
    audio_path = "assets/voiceover.mp3"
    genera_voce_ai(SCRIPT_TEXT)
    crea_video()
