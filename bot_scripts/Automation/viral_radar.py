import json
import os
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from ai_provider import openai_json

try:
    import google.generativeai as genai
except Exception:
    genai = None


REPO_ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = REPO_ROOT / "content_strategy"
RADAR_JSON = OUT_DIR / "viral_radar.json"
RADAR_MD = OUT_DIR / "viral_radar.md"


def rome_now():
    try:
        return datetime.now(ZoneInfo("Europe/Rome"))
    except Exception:
        return datetime.now()


def read_json(path, fallback):
    try:
        if path.exists():
            return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f"[!] Impossibile leggere {path}: {exc}")
    return fallback


def collect_signals():
    reel_history = read_json(
        REPO_ROOT / "bot_scripts" / "Social" / "ReelGenerator" / "history.json",
        [],
    )
    viral_hits = read_json(
        REPO_ROOT / "bot_scripts" / "Social" / "GrowthHack" / "viral_hits.json",
        [],
    )
    calendar = read_json(OUT_DIR / "today_brief.json", {})
    blog_titles = []
    blog_dir = REPO_ROOT / "content" / "blog"
    if blog_dir.exists():
        for file in sorted(blog_dir.glob("*.md"))[-10:]:
            text = file.read_text(encoding="utf-8", errors="ignore")
            title = file.stem.replace("-", " ")
            for line in text.splitlines()[:10]:
                if line.startswith("title:"):
                    title = line.split(":", 1)[1].strip().strip('"')
                    break
            blog_titles.append(title)
    return {
        "calendar": calendar,
        "reel_history": reel_history[-20:] if isinstance(reel_history, list) else [],
        "viral_hits": viral_hits[-20:] if isinstance(viral_hits, list) else [],
        "blog_titles": blog_titles,
    }


def fallback_ideas(signals):
    niche = signals.get("calendar", {}).get("niche") or "Parrucchieri"
    pain = signals.get("calendar", {}).get("pain") or "perdere tempo in chat"
    return [
        {
            "format": "pain shock",
            "niche": niche,
            "hook": f"Sei tra i {niche.lower()} e stai ancora gestendo tutto su WhatsApp?",
            "angle": f"Mostra quanto costa davvero {pain}.",
            "cta": "Commenta AGENDA e ti mando il link.",
        },
        {
            "format": "before after",
            "niche": niche,
            "hook": "Prima agenda piena di messaggi, dopo clienti che prenotano da soli.",
            "angle": "Confronto diretto tra caos manuale e link NeatX.",
            "cta": "Scrivi DEMO se vuoi provarlo.",
        },
        {
            "format": "calculator",
            "niche": niche,
            "hook": "Un no-show non è un fastidio, è fatturato perso.",
            "angle": "Stima soldi persi in un mese e collega promemoria/acconto.",
            "cta": "Commenta AGENDA.",
        },
    ]


def gemini_ideas(signals):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key or genai is None:
        return None

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(
        "gemini-1.5-flash",
        generation_config={"response_mime_type": "application/json"},
    )
    prompt = {
        "role": "viral radar for NeatX",
        "goal": "Create short-form video and blog ideas from available signals.",
        "rules": [
            "Italian output.",
            "No emojis.",
            "Hooks must be concrete and niche-specific.",
            "Return JSON with key ideas, an array of 5 objects.",
        ],
        "signals": signals,
    }
    try:
        response = model.generate_content(json.dumps(prompt, ensure_ascii=False))
        data = json.loads(response.text)
        if isinstance(data, dict) and isinstance(data.get("ideas"), list):
            return data["ideas"]
        if isinstance(data, list):
            return data
    except Exception as exc:
        print(f"[!] Gemini radar fallback: {exc}")
    return None


def openai_ideas(signals):
    prompt = {
        "role": "viral radar for NeatX",
        "goal": "Create short-form video and blog ideas from available signals.",
        "rules": [
            "Italian output.",
            "No emojis.",
            "Hooks must be concrete, punchy and niche-specific.",
            "Prioritize ideas that sell bookings automation without sounding like an ad.",
            "Return JSON with key ideas, an array of 5 objects.",
        ],
        "signals": signals,
    }
    data = openai_json(prompt, max_tokens=2500)
    if isinstance(data, dict) and isinstance(data.get("ideas"), list):
        print("[+] Idee radar generate con OpenAI.")
        return data["ideas"]
    if isinstance(data, list):
        print("[+] Idee radar generate con OpenAI.")
        return data
    return None


def write_outputs(signals, ideas):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    payload = {
        "generated_at": rome_now().isoformat(),
        "signals_used": {
            "reel_history_count": len(signals.get("reel_history", [])),
            "viral_hits_count": len(signals.get("viral_hits", [])),
            "blog_titles_count": len(signals.get("blog_titles", [])),
            "today_niche": signals.get("calendar", {}).get("niche"),
        },
        "ideas": ideas,
    }
    RADAR_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    lines = ["# NeatX Viral Radar", "", f"Generato: {payload['generated_at']}", ""]
    for index, idea in enumerate(ideas, 1):
        lines.append(f"## Idea {index}: {idea.get('hook', idea.get('title', 'Senza titolo'))}")
        for key, value in idea.items():
            lines.append(f"- {key}: {value}")
        lines.append("")
    RADAR_MD.write_text("\n".join(lines), encoding="utf-8")
    print(f"[+] Radar virale salvato in {RADAR_MD}")


def main():
    signals = collect_signals()
    ideas = openai_ideas(signals) or gemini_ideas(signals) or fallback_ideas(signals)
    write_outputs(signals, ideas)


if __name__ == "__main__":
    main()
