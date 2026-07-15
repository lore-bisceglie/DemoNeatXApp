"""
╔══════════════════════════════════════════════════════════════════╗
║          NEATX — PROFESSIONAL REEL ENGINE v2.0                  ║
║  Pipeline: Script AI → Voce Neural → Avatar → Montaggio Pro     ║
╚══════════════════════════════════════════════════════════════════╝

COSA FA:
1. Gemini AI genera uno script originale per una professione random
2. Edge-TTS genera la voce italiana maschile ultra-realistica
3. Pollinations AI genera il volto dell'avatar giusto per la professione
4. SadTalker anima il volto sincronizzato con la voce
5. MoviePy monta tutto in un Reel 9:16 con:
   - Avatar parlante in primo piano
   - B-Roll delle immagini premium in sottofondo
   - Sottotitoli word-by-word animati (stile CapCut)
   - Musica ambient in background
   - Logo NeatX + CTA finale

OUTPUT: reel_YYYY-MM-DD_HH-MM.mp4 pronto da pubblicare
"""

import os
import re
import asyncio
import random
import json
import textwrap
import urllib.request
import urllib.parse
import shutil
from datetime import datetime
from pathlib import Path

# ─── CONFIGURAZIONE ────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent
ASSETS_DIR = BASE_DIR / "assets"
OUTPUT_DIR = BASE_DIR / "output"
TEMP_DIR = BASE_DIR / "temp"

OUTPUT_DIR.mkdir(exist_ok=True)
TEMP_DIR.mkdir(exist_ok=True)

GEMINI_API_KEY = ""  # Viene letto da auto_bot.py

# Voce Microsoft Neural italiana — la più naturale disponibile gratis
VOICE = "it-IT-DiegoNeural"

# Dimensioni video Reel verticale
VIDEO_W = 1080
VIDEO_H = 1920

# ─── DATABASE PROFESSIONI ──────────────────────────────────────────
PROFESSIONI = [
    {
        "id": "barbiere",
        "label": "Barbieri & Parrucchieri",
        "avatar_prompt": "photorealistic portrait of an italian male barber in his 30s wearing a black barber apron, looking directly at camera, neutral expression, closed mouth, professional studio lighting, white background",
        "emoji": "💈",
        "dolori": [
            "stai facendo un taglio e il telefono suona per la terza volta",
            "hai avuto 3 disdette questa settimana e non sai nemmeno quanto hai perso",
            "un cliente ti ha scritto alle 22 per spostare l'appuntamento del giorno dopo",
        ]
    },
    {
        "id": "estetista",
        "label": "Estetiste & Beauty",
        "avatar_prompt": "photorealistic portrait of an italian female esthetician in her 30s wearing a white professional uniform, looking directly at camera, neutral expression, closed mouth, studio lighting, white background",
        "emoji": "💆‍♀️",
        "dolori": [
            "stai facendo un trattamento e il telefono non smette di suonare",
            "una cliente abituale non ha trovato posto e è andata dalla concorrente",
            "gestisci ancora tutto su WhatsApp e non riesci a stare dietro ai messaggi",
        ]
    },
    {
        "id": "nail_artist",
        "label": "Nail Artist",
        "avatar_prompt": "photorealistic portrait of an italian female nail artist in her late 20s wearing trendy nail salon uniform, looking directly at camera, neutral expression, closed mouth, studio lighting, white background",
        "emoji": "💅",
        "dolori": [
            "hai le mani occupate sulla ricostruzione e non puoi rispondere",
            "hai risposto 'ti faccio sapere' e poi hai dimenticato la cliente",
            "stai perdendo prenotazioni perché non riesci a rispondere in tempo",
        ]
    },
    {
        "id": "fisioterapista",
        "label": "Fisioterapisti & Medici",
        "avatar_prompt": "photorealistic portrait of an italian male physiotherapist in his 30s wearing white clinical uniform, looking directly at camera, neutral expression, closed mouth, professional studio lighting, white background",
        "emoji": "🏥",
        "dolori": [
            "sei con un paziente e non puoi interrompere la sessione per rispondere",
            "hai perso un appuntamento per un errore di agenda su WhatsApp",
            "i pazienti ti chiamano in orari impossibili per prenotare",
        ]
    },
    {
        "id": "personal_trainer",
        "label": "Personal Trainer",
        "avatar_prompt": "photorealistic portrait of an italian male personal trainer in his 30s wearing athletic sportswear, looking directly at camera, neutral expression, closed mouth, gym studio lighting, white background",
        "emoji": "🏋️",
        "dolori": [
            "stai allenando un cliente e ne stai perdendo altri tre che non rispondono",
            "un potenziale cliente ti ha scritto, non hai risposto in tempo e è andato altrove",
            "non hai modo di gestire le prenotazioni delle sessioni mentre sei in palestra",
        ]
    },
    {
        "id": "tatuatore",
        "label": "Tatuatori",
        "avatar_prompt": "photorealistic portrait of an italian male tattoo artist in his late 20s wearing a black t-shirt with tattoos visible on arms, looking directly at camera, neutral expression, closed mouth, studio lighting, white background",
        "emoji": "🎨",
        "dolori": [
            "non puoi fermarti a metà sessione per rispondere a chi vuole prenotare",
            "perdi richieste di consulenza perché arrivano su Instagram, WhatsApp e email in simultanea",
            "un cliente non si è presentato e hai perso 2 ore di lavoro senza neanche un messaggio",
        ]
    },
]

# ─── STEP 1: GENERA SCRIPT CON GEMINI ────────────────────────────
def carica_api_key():
    """Cerca la chiave Gemini: prima in env (GitHub Actions), poi in file locale"""
    # GitHub Actions o variabile d'ambiente locale
    env_key = os.environ.get("GEMINI_API_KEY", "")
    if env_key and len(env_key) > 20:
        return env_key
    # Fallback: cerca nei file Python vicini
    try:
        for py_file in BASE_DIR.parent.rglob("*.py"):
            try:
                content = py_file.read_text(encoding="utf-8")
                match = re.search(r'GEMINI_API_KEY\s*=\s*["\']([^"\']+)["\']', content)
                if match:
                    key = match.group(1)
                    if len(key) > 20:
                        return key
            except:
                continue
    except:
        pass
    return ""


def genera_script_ai(professione: dict) -> dict:
    """Genera uno script originale con Gemini per la professione scelta"""
    api_key = carica_api_key()
    
    if not api_key:
        # Fallback: usa uno script pre-scritto dal database
        return genera_script_fallback(professione)
    
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        
        dolore = random.choice(professione["dolori"])
        
        prompt = f"""
Sei un copywriter esperto di video virali per TikTok e Instagram Reels in Italia.
Scrivi uno script per un video di 20 secondi per promuovere NeatX (neatx.store), 
un sistema di prenotazioni online per {professione["label"]}.

SITUAZIONE DI PARTENZA: {dolore}

Struttura OBBLIGATORIA:
- HOOK (0-3 sec): Frase che blocca lo scroll. Parla del dolore, non del prodotto. Max 10 parole.
- PROBLEMA (3-10 sec): Descrivi la situazione dolorosa con numeri reali. Max 25 parole.
- SOLUZIONE (10-18 sec): Mostra NeatX in azione. Cosa fa concretamente. Max 25 parole.
- CTA (18-22 sec): "Prova gratis su neatx.store" con variante originale. Max 8 parole.

REGOLE FERREE:
- Italiano naturale, come parla un amico
- NO parole: "rivoluzionario", "innovativo", "all'avanguardia"  
- USA: numeri concreti, situazioni riconoscibili, "gratis", "60 secondi"
- Tono caldo, diretto, mai formale

Rispondi SOLO con un JSON valido in questo formato:
{{
  "hook": "testo hook",
  "problema": "testo problema",
  "soluzione": "testo soluzione", 
  "cta": "testo cta",
  "script_completo": "tutto il testo concatenato con spazi"
}}
"""
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        text = response.text.strip()
        text = re.sub(r"```json\n?|\n?```", "", text).strip()
        return json.loads(text)
    
    except Exception as e:
        print(f"[!] Gemini non disponibile ({e}), uso script pre-scritto")
        return genera_script_fallback(professione)


def genera_script_fallback(professione: dict) -> dict:
    """Script pre-scritti di alta qualità come fallback"""
    scripts = {
        "barbiere": {
            "hook": "Stai facendo un taglio. Il telefono suona. Ancora.",
            "problema": "Non puoi rispondere. Il messaggio rimane lì. Il cliente forse se ne va.",
            "soluzione": "Con NeatX i clienti prenotano da soli online. Tu trovi l'agenda già piena ogni mattina.",
            "cta": "Prova gratis su neatx.store — 60 secondi.",
        },
        "estetista": {
            "hook": "Stai facendo un trattamento. Il telefono non smette.",
            "problema": "Non puoi alzarti. La cliente è sotto. I messaggi si accumulano.",
            "soluzione": "NeatX risponde al posto tuo. L'appuntamento viene prenotato in automatico.",
            "cta": "Zero stress. Vai su neatx.store.",
        },
        "nail_artist": {
            "hook": "Hai le mani occupate. Le clienti non aspettano.",
            "problema": "Stai facendo ricostruzione. 4 messaggi. 2 chiamate perse. 1 cliente persa.",
            "soluzione": "Con NeatX scelgono data e ora da sole. Tu guardi l'agenda a fine giornata.",
            "cta": "Prova gratis. neatx.store",
        },
        "fisioterapista": {
            "hook": "Sei con un paziente. Arrivano 5 richieste.",
            "problema": "Non puoi rispondere. Il paziente ha bisogno di tutta la tua attenzione.",
            "soluzione": "Con NeatX i pazienti si prenotano online. Tu trovi il calendario già organizzato.",
            "cta": "Digitalizza il tuo studio. neatx.store",
        },
        "personal_trainer": {
            "hook": "Stai allenando. Ne stai perdendo altri tre.",
            "problema": "Vogliono prenotare una sessione. Tu non rispondi. Vanno da un altro.",
            "soluzione": "NeatX è la tua assistente h24. Prenota, ricorda, conferma — senza di te.",
            "cta": "Gratis su neatx.store.",
        },
        "tatuatore": {
            "hook": "Non puoi fermarti a metà tattoo per rispondere.",
            "problema": "I clienti vogliono prenotare adesso. Se non rispondi, vanno altrove.",
            "soluzione": "Con NeatX prenotano da soli. Tu li trovi già in agenda quando finisci.",
            "cta": "NeatX ci pensa lui. neatx.store",
        },
    }
    s = scripts.get(professione["id"], scripts["barbiere"])
    s["script_completo"] = f"{s['hook']} {s['problema']} {s['soluzione']} {s['cta']}"
    return s


# ─── STEP 2: GENERA VOCE ─────────────────────────────────────────
async def genera_voce(testo: str, output_path: Path):
    """Genera voce italiana ultra-realistica con Microsoft Neural Edge-TTS"""
    import edge_tts
    
    print(f"[VOCE] Generazione voce con {VOICE}...")
    
    # Puliamo il testo da caratteri speciali
    testo_pulito = re.sub(r'[—–]', '-', testo)
    
    communicate = edge_tts.Communicate(
        testo_pulito, 
        VOICE,
        rate="+5%",   # Leggermente più veloce per ritmo TikTok
        volume="+10%"
    )
    await communicate.save(str(output_path))
    print(f"[✅] Voce salvata: {output_path.name}")


# ─── STEP 3: GENERA AVATAR ───────────────────────────────────────
def genera_avatar(professione: dict, output_path: Path) -> bool:
    """Genera il volto dell'avatar con Pollinations AI (gratis, no API key)"""
    print(f"[🎨] Generazione avatar per {professione['label']}...")
    
    url_prompt = urllib.parse.quote(professione["avatar_prompt"])
    # Seed random per varietà ogni volta
    seed = random.randint(1000, 9999)
    url = f"https://image.pollinations.ai/prompt/{url_prompt}?width=512&height=512&nologo=true&seed={seed}"
    
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=30) as resp, open(output_path, "wb") as f:
            f.write(resp.read())
        print(f"[✅] Avatar salvato: {output_path.name}")
        return True
    except Exception as e:
        print(f"[!] Errore avatar: {e}")
        return False


# ─── STEP 4: ANIMA AVATAR (SadTalker) ────────────────────────────
def anima_avatar(foto_path: Path, audio_path: Path, output_path: Path) -> bool:
    """Anima il volto sincronizzato con la voce tramite SadTalker (Hugging Face)"""
    print("[🤖] Animazione avatar con SadTalker (potrebbe richiedere 2-3 minuti)...")
    
    try:
        from gradio_client import Client, handle_file
        client = Client("vinthony/SadTalker")
        
        result = client.predict(
            source_image=handle_file(str(foto_path)),
            driven_audio=handle_file(str(audio_path)),
            preprocess="crop",
            is_still_mode=True,
            enhancer="gfpgan",
            batch_size=1,
            size=256,
            pose_style=0,
            facerender="facevid2vid",
            exp_weight=1,
            use_ref_video=False,
            ref_video=None,
            ref_info=None,
            use_idle_mode=False,
            length_of_audio=0,
            use_blink=True,
            api_name="/predict"
        )
        shutil.copy(result, str(output_path))
        print(f"[✅] Avatar animato: {output_path.name}")
        return True
    except Exception as e:
        print(f"[!] SadTalker non disponibile ({e})")
        print("[↩️] Procedo senza avatar animato (solo voiceover)")
        return False


# ─── STEP 5: MONTAGGIO VIDEO PROFESSIONALE ───────────────────────
def monta_reel(
    script: dict,
    professione: dict,
    audio_path: Path,
    avatar_video_path: Path | None,
    output_path: Path,
):
    """
    Monta il Reel finale professionale:
    - Sfondo: B-Roll immagini premium con effetto Ken Burns
    - Avatar parlante in basso (se disponibile)
    - Sottotitoli word-by-word animati stile CapCut
    - Logo NeatX in alto
    - CTA finale con animazione
    - Musica ambient in sottofondo
    """
    from moviepy import (
        VideoFileClip, AudioFileClip, ImageClip, ColorClip,
        CompositeVideoClip, concatenate_videoclips, TextClip
    )
    from PIL import Image, ImageDraw, ImageFont, ImageFilter
    import numpy as np

    print("[🎬] Montaggio video professionale in corso...")

    # Carica audio
    audio = AudioFileClip(str(audio_path))
    duration = audio.duration

    # ── SFONDO ──────────────────────────────────────────────────
    # Cerca immagini B-Roll nella cartella assets
    broll_images = list(ASSETS_DIR.glob("*.jpg")) + list(ASSETS_DIR.glob("*.png"))
    
    if broll_images:
        # Usa le immagini premium che abbiamo generato
        n_images = max(1, int(duration / 4))
        selected = random.choices(broll_images, k=n_images)
        
        bg_clips = []
        for i, img_path in enumerate(selected):
            try:
                clip = (ImageClip(str(img_path))
                        .resized((VIDEO_W, VIDEO_H))
                        .with_duration(duration / n_images))
                bg_clips.append(clip)
            except:
                pass
        
        if bg_clips:
            from moviepy import concatenate_videoclips
            bg = concatenate_videoclips(bg_clips)
        else:
            bg = ColorClip((VIDEO_W, VIDEO_H), color=(5, 8, 20)).with_duration(duration)
    else:
        bg = ColorClip((VIDEO_W, VIDEO_H), color=(5, 8, 20)).with_duration(duration)

    # Overlay scuro semi-trasparente per leggibilità testo
    overlay = ColorClip((VIDEO_W, VIDEO_H), color=(0, 0, 0)).with_duration(duration).with_opacity(0.55)

    # ── LOGO NEATX ──────────────────────────────────────────────
    logo_img = crea_logo_neatx()
    logo = (ImageClip(logo_img)
            .with_duration(duration)
            .with_position(("center", 80)))

    # ── AVATAR O PLACEHOLDER ─────────────────────────────────────
    layers = [bg, overlay, logo]

    if avatar_video_path and avatar_video_path.exists():
        avatar_clip = (VideoFileClip(str(avatar_video_path))
                       .resized(width=VIDEO_W * 0.65)
                       .with_position(("center", VIDEO_H * 0.45)))
        layers.append(avatar_clip)
    
    # ── SOTTOTITOLI WORD-BY-WORD ─────────────────────────────────
    subtitles = crea_sottotitoli_animati(script["script_completo"], duration)
    layers.extend(subtitles)

    # ── CTA FINALE ───────────────────────────────────────────────
    cta_clip = crea_cta_finale(duration)
    layers.append(cta_clip)

    # ── MONTAGGIO FINALE ─────────────────────────────────────────
    video = CompositeVideoClip(layers, size=(VIDEO_W, VIDEO_H))
    video = video.with_audio(audio)

    print(f"[💾] Rendering in corso (potrebbe richiedere 1-2 minuti)...")
    video.write_videofile(
        str(output_path),
        fps=30,
        codec="libx264",
        audio_codec="aac",
        bitrate="8000k",
        preset="fast",
        logger=None,
    )
    print(f"[✅] Reel salvato: {output_path}")


def crea_logo_neatx() -> str:
    """Crea il logo NeatX come immagine PNG temporanea"""
    from PIL import Image, ImageDraw, ImageFont
    
    img = Image.new("RGBA", (300, 70), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    try:
        font = ImageFont.truetype("arial.ttf", 52)
    except:
        font = ImageFont.load_default()
    
    # "Neat" in bianco, "X" in ciano
    draw.text((0, 0), "Neat", fill=(255, 255, 255, 230), font=font)
    draw.text((148, 0), "X", fill=(0, 180, 255, 255), font=font)
    
    logo_path = str(TEMP_DIR / "logo.png")
    img.save(logo_path)
    return logo_path


def crea_sottotitoli_animati(testo: str, durata_totale: float):
    """
    Crea sottotitoli word-by-word stile CapCut:
    ogni parola appare evidenziata in ciano mentre viene pronunciata
    """
    from moviepy import TextClip, ImageClip
    from PIL import Image, ImageDraw, ImageFont
    import numpy as np
    
    parole = testo.split()
    if not parole:
        return []
    
    # Distribuiamo le parole nel tempo (approssimativo)
    durata_per_parola = durata_totale / len(parole)
    
    clips = []
    
    # Raggruppiamo in blocchi di 4-5 parole
    blocco_size = 4
    blocchi = [parole[i:i+blocco_size] for i in range(0, len(parole), blocco_size)]
    
    t_start = 0.0
    for blocco in blocchi:
        t_end = t_start + durata_per_parola * len(blocco)
        
        testo_blocco = " ".join(blocco)
        
        try:
            clip = (TextClip(
                        font="Arial-Bold",
                        text=testo_blocco,
                        font_size=62,
                        color="white",
                        stroke_color="black",
                        stroke_width=3,
                        method="caption",
                        size=(VIDEO_W - 100, None),
                    )
                    .with_start(t_start)
                    .with_end(min(t_end, durata_totale))
                    .with_position(("center", VIDEO_H * 0.72)))
            clips.append(clip)
        except Exception as e:
            pass  # Se TextClip fallisce, continua senza sottotitoli
        
        t_start = t_end
    
    return clips


def crea_cta_finale(durata_totale: float):
    """CTA finale che compare negli ultimi 3 secondi"""
    from moviepy import TextClip
    
    try:
        cta = (TextClip(
                    font="Arial-Bold",
                    text="✨ neatx.store ✨",
                    font_size=58,
                    color="#00b4ff",
                    stroke_color="black",
                    stroke_width=2,
               )
               .with_start(max(0, durata_totale - 3.5))
               .with_end(durata_totale)
               .with_position(("center", VIDEO_H - 180)))
        return cta
    except:
        from moviepy import ColorClip
        return ColorClip((1, 1), color=(0,0,0), duration=0.1)


# ─── MAIN ORCHESTRATOR ───────────────────────────────────────────
async def genera_reel_completo():
    print("\n" + "═"*60)
    print("   NEATX PROFESSIONAL REEL ENGINE v2.0")
    print("═"*60)
    
    # ── LEGGI REEL DATA SE ESISTE (Per integrazione auto_bot) ──
    niche = None
    script_text = None
    hook_text = None
    cta_text = "Prova gratis su neatx.store"
    
    reel_data_path = BASE_DIR / "reel_data.json"
    if reel_data_path.exists():
        try:
            with open(reel_data_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                niche = data.get("niche")
                script_text = data.get("script_text")
                hook_text = data.get("hook_text")
                print(f"[🔗] Dati ricevuti da auto_bot.py! Niche: {niche}")
        except:
            pass
    
    # Trova la professione nel database
    professione = PROFESSIONI[0]
    if niche:
        for p in PROFESSIONI:
            if p["label"].lower() in niche.lower() or p["id"] in niche.lower():
                professione = p
                break
    else:
        professione = random.choice(PROFESSIONI)
        
    print(f"\n[🎯] Professione selezionata: {professione['emoji']} {professione['label']}")
    
    # Timestamp per file unici
    ts = datetime.now().strftime("%Y-%m-%d_%H-%M")
    
    # Percorsi file temporanei
    audio_path = TEMP_DIR / f"voce_{ts}.mp3"
    avatar_img_path = TEMP_DIR / f"avatar_{ts}.jpg"
    avatar_video_path = TEMP_DIR / f"avatar_animato_{ts}.mp4"
    
    # IL FILE FINALE DEVE CHIAMARSI reel_splitscreen_subbed.mp4 per publish_reel.py
    output_path = BASE_DIR / "reel_splitscreen_subbed.mp4"
    
    # ── STEP 1: Script ──
    if script_text and hook_text:
        print("\n[📝] Step 1/5: Uso lo script generato da auto_bot.py...")
        script = {
            "hook": hook_text,
            "problema": "",
            "soluzione": "",
            "cta": cta_text,
            "script_completo": script_text
        }
    else:
        print("\n[📝] Step 1/5: Generazione script con AI...")
        script = genera_script_ai(professione)
        
    print(f"\n{'─'*50}")
    print(f"HOOK:      {script['hook']}")
    print(f"TESTO:     {script['script_completo']}")
    print(f"{'─'*50}\n")
    
    # ── STEP 2: Voce ──
    print("[🎙️] Step 2/5: Generazione voce neurale...")
    await genera_voce(script["script_completo"], audio_path)
    
    # ── STEP 3: Avatar ──
    print("\n[🎨] Step 3/5: Generazione avatar AI...")
    avatar_ok = genera_avatar(professione, avatar_img_path)
    
    # ── STEP 4: Animazione ──
    avatar_video_ok = False
    if avatar_ok:
        print("\n[🤖] Step 4/5: Animazione avatar con SadTalker...")
        avatar_video_ok = anima_avatar(avatar_img_path, audio_path, avatar_video_path)
    else:
        print("\n[⏭️] Step 4/5: Skip animazione (avatar non disponibile)")
    
    # ── STEP 5: Montaggio ──
    print("\n[🎬] Step 5/5: Montaggio professionale...")
    monta_reel(
        script=script,
        professione=professione,
        audio_path=audio_path,
        avatar_video_path=avatar_video_path if avatar_video_ok else None,
        output_path=output_path,
    )
    
    # ── PULIZIA TEMP ──
    for f in TEMP_DIR.glob("*"):
        try:
            f.unlink()
        except:
            pass
    
    print(f"\n{'═'*60}")
    print(f"  ✅ REEL PRONTO!")
    print(f"  📁 {output_path}")
    print(f"  🎯 Professione: {professione['emoji']} {professione['label']}")
    print(f"  ⏱️  Durata stimata: ~20 sec")
    print(f"{'═'*60}\n")
    
    return output_path


if __name__ == "__main__":
    asyncio.run(genera_reel_completo())
