#!/usr/bin/env python3
"""
NeatX Content Calendar Generator
Genera il tema giornaliero per articoli, reel e social content.
Legge da Google Gemini per coerenza tematica.
"""

import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

try:
    from google import genai
    from google.genai import types
except ImportError:
    print("⚠️  google-generativeai not installed. Install with: pip install google-generativeai")
    exit(1)

# Configurazione
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("❌ GEMINI_API_KEY not set")
    exit(1)

client = genai.Client(api_key=GEMINI_API_KEY)

# Path
SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR / "daily_theme.json"
CALENDAR_DIR = SCRIPT_DIR.parent.parent / "content" / "calendar"
CALENDAR_DIR.mkdir(parents=True, exist_ok=True)

# Zona oraria: Europe/Rome
TZ_ROME = ZoneInfo("Europe/Rome")


def generate_daily_theme():
    """Genera tema giornaliero usando Gemini con coerenza semantica."""
    now_rome = datetime.now(TZ_ROME)
    today = now_rome.date().isoformat()
    
    prompt = f"""Genera un tema giornaliero per content marketing (articoli, reel, social post).
    
Data: {today}
Settore principale: Beauty, Wellness e Parrucchieri.

Rispondi in JSON con questa struttura:
{{
    "date": "{today}",
    "main_topic": "...",
    "subtopic": "...",
    "angle": "...",
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"],
    "emoji": "emoji appropriata",
    "tone": "tone per il day",
    "story_hook": "hook accattivante per apertura reel",
    "cta": "call-to-action consigliato"
}}

Sii creativo ma mantieni coerenza con il settore. Tema deve essere applicabile a articolo blog, reel Instagram e social post."""
    
    print(f"🔄 Generating theme for {today}...")
    response = client.models.generate_content(model="gemini-3.5-flash", contents=prompt)
    
    # Estrai JSON dalla risposta
    text = response.text
    start = text.find("{")
    end = text.rfind("}") + 1
    
    if start == -1 or end == 0:
        print(f"❌ Could not parse JSON from response:\n{text}")
        exit(1)
    
    try:
        theme_data = json.loads(text[start:end])
    except json.JSONDecodeError as e:
        print(f"❌ JSON parse error: {e}")
        print(f"Extracted text: {text[start:end]}")
        exit(1)
    
    return theme_data


def save_theme(theme_data):
    """Salva il tema in JSON per accesso da altri script."""
    with open(DATA_DIR, "w", encoding="utf-8") as f:
        json.dump(theme_data, f, ensure_ascii=False, indent=2)
    print(f"✅ Theme saved to {DATA_DIR}")


def create_calendar_post(theme_data):
    """Crea un markdown con il tema del giorno nel calendario."""
    date = theme_data.get("date", "unknown")
    main_topic = theme_data.get("main_topic", "")
    subtopic = theme_data.get("subtopic", "")
    angle = theme_data.get("angle", "")
    keywords = ", ".join(theme_data.get("keywords", []))
    hashtags = " ".join(theme_data.get("hashtags", []))
    emoji = theme_data.get("emoji", "📌")
    tone = theme_data.get("tone", "")
    story_hook = theme_data.get("story_hook", "")
    cta = theme_data.get("cta", "")
    
    markdown = f"""# Tema {emoji} {date}

## Argomento principale
**{main_topic}**

## Sottotema
{subtopic}

## Angolazione
{angle}

## Keywords
{keywords}

## Hashtag consigliati
{hashtags}

## Tone of voice
{tone}

## Story Hook (apertura reel)
> {story_hook}

## Call-to-Action
{cta}

---

*Generato automaticamente da NeatX Content Calendar*
*Tempo: {datetime.now(ZoneInfo('Europe/Rome')).isoformat()}*
"""
    
    calendar_file = CALENDAR_DIR / f"{date}-theme.md"
    calendar_file.write_text(markdown, encoding="utf-8")
    print(f"✅ Calendar post created: {calendar_file}")


def main():
    print("\n🗓️  NeatX Content Calendar Generator")
    print("=" * 50)
    
    theme_data = generate_daily_theme()
    print(f"\n📋 Theme generated:")
    print(f"   Topic: {theme_data.get('main_topic')}")
    print(f"   Subtopic: {theme_data.get('subtopic')}")
    print(f"   Angle: {theme_data.get('angle')}")
    
    save_theme(theme_data)
    create_calendar_post(theme_data)
    
    print("\n✅ Content Calendar update complete!")


if __name__ == "__main__":
    main()
