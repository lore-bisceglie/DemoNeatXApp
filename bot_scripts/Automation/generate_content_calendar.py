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

FEATURES = [
    {"id": "no_show", "label": "Zero No-Show", "pain": "acconti automatici che filtrano i clienti che non si presentano", "promise": "ogni slot occupato da clienti che hanno già pagato"},
    {"id": "booking", "label": "Prenotazione 24/7", "pain": "telefono che squilla tutto il giorno e messaggi senza fine", "promise": "clienti che prenotano da soli anche mentre dormi"},
    {"id": "timesheet", "label": "Timesheet Commercialista", "pain": "ore dei dipendenti segnate a mano su fogli Excel persi", "promise": "turni, ferie e permessi in un click, CSV pronto per il commercialista"},
    {"id": "recensioni", "label": "Recensioni Automatiche", "pain": "clienti soddisfatti che non lasciano recensioni e clienti arrabbiati che le lasciano pubbliche", "promise": "recensioni Google da ogni cliente soddisfatto, feedback privato per chi si lamenta"},
    {"id": "promemoria", "label": "Promemoria WhatsApp", "pain": "clienti che dimenticano l'appuntamento e non rispondono al telefono", "promise": "promemoria automatici che riducono i no-show del 90%"},
    {"id": "analytics", "label": "Statistiche e Dati", "pain": "non sai quanto guadagni davvero, quali servizi rendono di piu, quali orari sono vuoti", "promise": "dashboard con incassi, trend e performance in tempo reale"},
    {"id": "multi_staff", "label": "Gestione Staff", "pain": "turni multipli, ferie da coordinare e clienti assegnati al collaboratore sbagliato", "promise": "ogni staff con la propria agenda, turni automatici e clienti assegnati al professionista giusto"},
]

TARGETS = [
    {
        "niche": "Parrucchieri",
        "image_prompt": "photorealistic modern hair salon, professional hairdresser working with a client, premium realistic lighting",
        "keywords": ["gestionale parrucchieri", "prenotazioni parrucchiere", "agenda salone"],
    },
    {
        "niche": "Barbieri",
        "image_prompt": "photorealistic luxury barber shop, barber shaping beard, cinematic realistic lighting",
        "keywords": ["gestionale barbiere", "prenotazioni barbiere", "no show barber shop"],
    },
    {
        "niche": "Centri Estetici",
        "image_prompt": "photorealistic beauty center, esthetician performing facial treatment, clean premium spa room",
        "keywords": ["gestionale centro estetico", "prenotazioni estetista", "agenda centro estetico"],
    },
    {
        "niche": "Fisioterapisti",
        "image_prompt": "photorealistic physiotherapy studio, physiotherapist helping patient with rehabilitation, modern clinic",
        "keywords": ["agenda fisioterapista", "prenotazioni fisioterapia", "gestionale fisioterapisti"],
    },
    {
        "niche": "Tatuatori",
        "image_prompt": "photorealistic tattoo studio, tattoo artist working carefully, modern professional workspace",
        "keywords": ["prenotazioni tatuatore", "agenda tatuatori", "caparra tatuaggio"],
    },
    {
        "niche": "Coach e Consulenti",
        "image_prompt": "photorealistic consultant in modern office during video call, laptop calendar visible, premium business setup",
        "keywords": ["agenda consulente", "prenotazioni coach", "booking consulenze"],
    },
    {
        "niche": "Personal Trainer",
        "image_prompt": "photorealistic personal trainer coaching client in modern gym, energetic professional scene",
        "keywords": ["agenda personal trainer", "prenotazioni palestra", "gestionale personal trainer"],
    },
]

GAMEPLAY_STYLES = ["runner", "block_miner", "neon_racer"]


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
        "task": "Generate a fresh 7-day Italian content calendar for short videos and SEO blog posts. I give you the seed structure with niche, pain, promise and feature for each day. You MUST generate a UNIQUE, ORIGINAL cover_title for each day from scratch — never repeat a title you already used in previous runs.",
        "rules": [
            "Use Italian copy.",
            "Each hook must be concrete, painful and specific to the niche.",
            "cover_title max 4 words, MUST be different from any cover_format used before, think of a new angle every time.",
            "No emojis.",
            "Keep image_prompt in English and coherent with the niche.",
        ],
        "calendar": seed_items,
    }
    try:
        response = client.models.generate_content(model="gemini-3.5-flash", contents=json.dumps(prompt, ensure_ascii=False))
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
        "task": "Generate a fresh 7-day Italian content calendar for short videos and SEO blog posts. I give you the seed structure with niche, pain, promise and feature for each day. You MUST generate a UNIQUE, ORIGINAL cover_title for each day from scratch — think of a new marketing angle, never reuse a title you have seen before.",
        "rules": [
            "Use Italian copy that sounds human and commercially sharp.",
            "Each hook must be concrete, painful and specific to the niche.",
            "cover_title max 4 words, NEVER generic, always specific to the pain of that niche.",
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
    rotated_features = FEATURES[:]
    random.shuffle(rotated_features)
    for i in range(7):
        target = rotated[i % len(rotated)]
        feature = rotated_features[i % len(rotated_features)]
        date = today + timedelta(days=i)
        gameplay = GAMEPLAY_STYLES[(i + date.day) % len(GAMEPLAY_STYLES)]
        hook_angles = [
            f"ADDIO {feature['pain'].split()[0].upper()}",
            f"{target['niche'].upper()}: {feature['promise'][:20].upper()}",
            f"{feature['label'][:15].upper()} ORA",
            f"BASTA {feature['id'].upper().replace('_', ' ')}",
        ]
        fallback_cover = hook_angles[(i + date.day) % len(hook_angles)]
        items.append(
            {
                "date": date.isoformat(),
                "niche": target["niche"],
                "feature": feature["id"],
                "feature_label": feature["label"],
                "pain": feature["pain"],
                "promise": feature["promise"],
                "cover_title": fallback_cover,
                "hook_hint": f"Se sei tra i {target['niche'].lower()} e {feature['pain']}, stai perdendo soldi.",
                "blog_topic": f"{target['niche']}: {feature['label']} con NeatX",
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
        lines.append(f"## {item['date']} - {item['niche']} - {item.get('feature_label', item.get('feature', '?'))}")
        lines.append(f"- Dolore: {item['pain']}")
        lines.append(f"- Promessa: {item['promise']}")
        lines.append(f"- Cover: {item['cover_title']}")
        lines.append(f"- Blog: {item['blog_topic']}")
        lines.append("")
    CALENDAR_MD.write_text("\n".join(lines), encoding="utf-8")

    print(f"[+] Calendario salvato in {CALENDAR_JSON}")
    print(f"[+] Brief di oggi: {today_brief.get('niche')} / {today_brief.get('feature_label', today_brief.get('feature', '?'))} / {today_brief.get('cover_title')}")


def main():
    seed = build_seed_calendar()
    days = openai_calendar(seed) or gemini_calendar(seed) or seed
    write_outputs(days)


if __name__ == "__main__":
    main()
