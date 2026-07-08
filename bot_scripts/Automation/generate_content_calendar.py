import json
import os
import random
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

from ai_provider import openai_json

try:
    from google import genai
    from google.genai import types
except Exception:
    genai = None


REPO_ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = REPO_ROOT / "content_strategy"
CALENDAR_JSON = OUT_DIR / "content_calendar.json"
TODAY_BRIEF_JSON = OUT_DIR / "today_brief.json"
CALENDAR_MD = OUT_DIR / "content_calendar.md"

TARGETS = [
    {
        "niche": "Parrucchieri",
        "pain": "clienti che scrivono su WhatsApp a qualsiasi ora",
        "promise": "agenda piena senza perdere tempo in chat",
        "image_prompt": "photorealistic modern hair salon, professional hairdresser working with a client, premium realistic lighting",
        "keywords": ["gestionale parrucchieri", "prenotazioni parrucchiere", "agenda salone"],
    },
    {
        "niche": "Barbieri",
        "pain": "no-show e appuntamenti presi al volo in DM",
        "promise": "meno buchi in agenda e più clienti paganti",
        "image_prompt": "photorealistic luxury barber shop, barber shaping beard, cinematic realistic lighting",
        "keywords": ["gestionale barbiere", "prenotazioni barbiere", "no show barber shop"],
    },
    {
        "niche": "Centri Estetici",
        "pain": "cabine vuote e clienti che dimenticano l'appuntamento",
        "promise": "promemoria automatici e acconti prima del trattamento",
        "image_prompt": "photorealistic beauty center, esthetician performing facial treatment, clean premium spa room",
        "keywords": ["gestionale centro estetico", "prenotazioni estetista", "agenda centro estetico"],
    },
    {
        "niche": "Fisioterapisti",
        "pain": "sedute saltate e agenda piena di cambi manuali",
        "promise": "prenotazioni ordinate e promemoria per ogni paziente",
        "image_prompt": "photorealistic physiotherapy studio, physiotherapist helping patient with rehabilitation, modern clinic",
        "keywords": ["agenda fisioterapista", "prenotazioni fisioterapia", "gestionale fisioterapisti"],
    },
    {
        "niche": "Tatuatori",
        "pain": "consulenze infinite e appuntamenti senza caparra",
        "promise": "richieste filtrate e acconto prima dello slot",
        "image_prompt": "photorealistic tattoo studio, tattoo artist working carefully, modern professional workspace",
        "keywords": ["prenotazioni tatuatore", "agenda tatuatori", "caparra tatuaggio"],
    },
    {
        "niche": "Coach e Consulenti",
        "pain": "call fissate a mano e clienti che rimandano",
        "promise": "call prenotate da sole e follow-up più semplice",
        "image_prompt": "photorealistic consultant in modern office during video call, laptop calendar visible, premium business setup",
        "keywords": ["agenda consulente", "prenotazioni coach", "booking consulenze"],
    },
    {
        "niche": "Personal Trainer",
        "pain": "lezioni spostate in chat e slot persi",
        "promise": "sessioni prenotate, confermate e ricordate automaticamente",
        "image_prompt": "photorealistic personal trainer coaching client in modern gym, energetic professional scene",
        "keywords": ["agenda personal trainer", "prenotazioni palestra", "gestionale personal trainer"],
    },
]

GAMEPLAY_STYLES = ["runner", "block_miner", "neon_racer"]
ANGLES = [
    "quanto tempo perdi rispondendo ai messaggi",
    "quanto ti costano i no-show ogni mese",
    "perché il link in bio deve prenotare da solo",
    "come usare acconti e promemoria senza sembrare aggressivo",
    "come trasformare follower curiosi in appuntamenti veri",
]


def rome_today():
    try:
        return datetime.now(ZoneInfo("Europe/Rome")).date()
    except Exception:
        return datetime.now().date()


def gemini_calendar(seed_items):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key or genai is None:
        return None

    client = genai.Client(api_key=api_key)
    prompt = {
        "role": "NeatX content strategist",
        "task": "Improve this 7-day Italian content calendar for short videos and SEO blog posts. Keep the same JSON shape.",
        "rules": [
            "Use Italian copy.",
            "Each hook must be concrete, painful and specific to the niche.",
            "cover_title max 4 words.",
            "No emojis.",
            "Keep image_prompt in English and coherent with the niche.",
        ],
        "calendar": seed_items,
    }
    try:
        response = client.models.generate_content(model="gemini-1.5-flash", contents=json.dumps(prompt, ensure_ascii=False))
        data = json.loads(response.text)
        if isinstance(data, dict) and isinstance(data.get("days"), list):
            return data["days"]
        if isinstance(data, list):
            return data
    except Exception as exc:
        print(f"[!] Gemini calendar fallback: {exc}")
    return None


def openai_calendar(seed_items):
    prompt = {
        "role": "NeatX senior content strategist",
        "task": "Improve this 7-day Italian content calendar for short videos and SEO blog posts. Keep the same JSON shape.",
        "rules": [
            "Use Italian copy that sounds human and commercially sharp.",
            "Each hook must be concrete, painful and specific to the niche.",
            "cover_title max 4 words.",
            "No emojis.",
            "Keep image_prompt in English and coherent with the niche.",
            "Avoid generic marketing language.",
            "Return JSON with key days, an array of 7 objects.",
        ],
        "calendar": seed_items,
    }
    data = openai_json(prompt, max_tokens=3500)
    if isinstance(data, dict) and isinstance(data.get("days"), list):
        print("[+] Calendario migliorato con OpenAI.")
        return data["days"]
    if isinstance(data, list):
        print("[+] Calendario migliorato con OpenAI.")
        return data
    return None


def build_seed_calendar():
    today = rome_today()
    items = []
    rotated = TARGETS[:]
    random.shuffle(rotated)
    for i in range(7):
        target = rotated[i % len(rotated)]
        date = today + timedelta(days=i)
        angle = ANGLES[(i + date.weekday()) % len(ANGLES)]
        gameplay = GAMEPLAY_STYLES[(i + date.day) % len(GAMEPLAY_STYLES)]
        cover_title = f"{target['niche'].upper()}: BASTA NO-SHOW"
        if len(cover_title.split()) > 4:
            cover_title = "BASTA NO-SHOW"
        items.append(
            {
                "date": date.isoformat(),
                "niche": target["niche"],
                "angle": angle,
                "pain": target["pain"],
                "promise": target["promise"],
                "cover_title": cover_title,
                "hook_hint": f"Se sei tra i {target['niche'].lower()} e {target['pain']}, stai perdendo soldi.",
                "blog_topic": f"{target['niche']}: {angle} con un'agenda automatica",
                "gameplay_style": gameplay,
                "image_prompt": target["image_prompt"],
                "keywords": target["keywords"],
            }
        )
    return items


def write_outputs(days):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    today = rome_today().isoformat()
    today_brief = next((item for item in days if item.get("date") == today), days[0])

    CALENDAR_JSON.write_text(
        json.dumps({"generated_at": datetime.now().isoformat(), "days": days}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    TODAY_BRIEF_JSON.write_text(json.dumps(today_brief, ensure_ascii=False, indent=2), encoding="utf-8")

    lines = ["# NeatX Content Calendar", ""]
    for item in days:
        lines.append(f"## {item['date']} - {item['niche']}")
        lines.append(f"- Angolo: {item['angle']}")
        lines.append(f"- Dolore: {item['pain']}")
        lines.append(f"- Promessa: {item['promise']}")
        lines.append(f"- Cover: {item['cover_title']}")
        lines.append(f"- Blog: {item['blog_topic']}")
        lines.append("")
    CALENDAR_MD.write_text("\n".join(lines), encoding="utf-8")

    print(f"[+] Calendario salvato in {CALENDAR_JSON}")
    print(f"[+] Brief di oggi: {today_brief.get('niche')} / {today_brief.get('angle')}")


def main():
    seed = build_seed_calendar()
    days = openai_calendar(seed) or gemini_calendar(seed) or seed
    write_outputs(days)


if __name__ == "__main__":
    main()
