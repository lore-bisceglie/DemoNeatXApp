import os
import asyncio
from moviepy.editor import VideoFileClip, AudioFileClip, TextClip, CompositeVideoClip, clips_array, ImageClip, vfx
import edge_tts
from PIL import Image

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

def genera_immagine_ai(nicchia):
    percorso_img = "assets/niche_bg.jpg"
    if os.path.exists(percorso_img):
        print("[*] Immagine AI già presente. Salto la generazione.")
        return percorso_img
        
    print(f"[*] Generazione immagine 4K per la nicchia: {nicchia} (tramite AI Gratuita)...")
    try:
        import urllib.parse
        prompt = f"A professional {nicchia} at work in their typical workplace, cinematic 4k shot, photorealistic, highly detailed, dramatic lighting"
        safe_prompt = urllib.parse.quote(prompt)
        url = f"https://image.pollinations.ai/prompt/{safe_prompt}?width=1080&height=1920&nologo=true"
        
        img_data = requests.get(url).content
        with open(percorso_img, 'wb') as handler:
            handler.write(img_data)
        print("[+] Immagine AI generata e salvata con successo!")
    except Exception as e:
        print(f"[!] Errore durante la generazione dell'immagine AI: {e}")
        img = Image.new('RGB', (1080, 1920), color = (20, 20, 20))
        img.save(percorso_img)
        print("[!] Usata immagine nera di ripiego.")
        
    return percorso_img

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
    
    # 1. Carica il video Dinamico di Pexels (Metà Superiore)
    path_satisfying = "assets/dynamic_bg.mp4"
    if not os.path.exists(path_satisfying):
        print(f"[ATTENZIONE] Manca il video Pexels: {path_satisfying}. Fallback su subway_surfers.mp4")
        path_satisfying = "assets/subway_surfers.mp4"
        if not os.path.exists(path_satisfying):
            print(f"[ERRORE] Nessun video di sfondo trovato!")
            return
            
    clip_top = VideoFileClip(path_satisfying).without_audio()
    
    # Pesca un frammento casuale del video
    if clip_top.duration > duration:
        max_start = clip_top.duration - duration - 1
        start_t = random.uniform(0, max_start)
        clip_top = clip_top.subclip(start_t, start_t + duration)
    else:
        clip_top = clip_top.fx(vfx.loop, duration=duration)
        
    # I video di Pexels sono puliti, non c'è bisogno di tagliare i bordi!
    # Ridimensiona per occupare esattamente la metà superiore (1080x960)
    clip_top = resize_and_crop(clip_top, REEL_WIDTH, REEL_HEIGHT // 2)

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
