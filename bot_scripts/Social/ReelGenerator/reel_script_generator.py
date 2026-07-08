#!/usr/bin/env python3
"""
NeatX Reel Script Generator
Genera script completi per reel basati su trend virali + tema giornaliero.
Include timing, transizioni, musica suggerita e istruzioni per editor.
"""

import json
import os
from datetime import datetime
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
DATA_DIR = SCRIPT_DIR.parent.parent
TRENDS_FILE = DATA_DIR / "Social/ViralRadar/trending_ideas.json"
CALENDAR_FILE = DATA_DIR / "Content/daily_theme.json"
SCRIPTS_DIR = SCRIPT_DIR / "reel_scripts"
SCRIPTS_DIR.mkdir(parents=True, exist_ok=True)

# Zona oraria
TZ_ROME = ZoneInfo("Europe/Rome")


def load_context():
    """Carica trend virali e tema del giorno."""
    trends = {}
    calendar = {}
    
    if TRENDS_FILE.exists():
        with open(TRENDS_FILE, "r", encoding="utf-8") as f:
            trends = json.load(f)
    
    if CALENDAR_FILE.exists():
        with open(CALENDAR_FILE, "r", encoding="utf-8") as f:
            calendar = json.load(f)
    
    return trends, calendar


def generate_reel_scripts(trends, calendar):
    """Genera 3 script reel completi."""
    trends_summary = ""
    if trends.get("trends"):
        trends_summary = "\n".join([
            f"- {t.get('trend_name')}: {t.get('description')}"
            for t in trends.get("trends", [])[:3]
        ])
    
    calendar_topic = calendar.get("main_topic", "Beauty & Wellness")
    calendar_hook = calendar.get("story_hook", "")
    
    prompt = f"""Genera 3 script COMPLETI per reel Instagram (30-60 secondi) per parrucchieri/beauty.

CONTESTO TREND VIRALI:
{trends_summary if trends_summary else "Trend general beauty e wellness"}

TEMA GIORNALIERO: {calendar_topic}
HOOK SUGGERITO: {calendar_hook if calendar_hook else "Genera uno hook accattivante"}

Per OGNI script rispondi in JSON con questa struttura:
{{
    "script_id": 1,
    "title": "titolo breve",
    "duration_seconds": 30,
    "trend_connection": "quale trend sfrutta",
    "hook": {{
        "seconds": "0-3",
        "text": "apertura accattivante (massimo 10 parole)",
        "visual": "descrizione visiva di cosa mostrare"
    }},
    "middle": [
        {{
            "seconds": "3-15",
            "text": "cosa dici/fai",
            "visual": "cosa mostra la camera",
            "transition": "cut|zoom|pan|fade"
        }},
        {{
            "seconds": "15-25",
            "text": "continuazione",
            "visual": "follow-up visivo",
            "transition": "cut|zoom"
        }}
    ],
    "cta": {{
        "seconds": "25-30",
        "text": "call-to-action finale (max 5 parole)",
        "visual": "mostra link/info in basso"
    }},
    "music_suggestion": "tipo musica (upbeat pop, trending TikTok, etc)",
    "equipment_needed": ["lista", "di", "attrezzatura"],
    "editing_tips": [
        "consiglio editing 1",
        "consiglio editing 2"
    ],
    "hashtags": ["#tag1", "#tag2", "#tag3"],
    "difficulty": "facile|medio|difficile",
    "estimated_views": "stima engagement basata su trend"
}}

Genera ESATTAMENTE 3 script diversi. Output in JSON array."""
    
    print("🎬 Generating reel scripts...")
    response = client.models.generate_content(model="gemini-1.5-flash", contents=prompt)
    
    text = response.text
    start = text.find("[")
    end = text.rfind("]") + 1
    
    if start == -1 or end == 0:
        print(f"❌ Could not parse JSON from response")
        return []
    
    try:
        scripts = json.loads(text[start:end])
    except json.JSONDecodeError as e:
        print(f"❌ JSON parse error: {e}")
        return []
    
    return scripts


def save_scripts(scripts):
    """Salva script in JSON e markdown."""
    now_rome = datetime.now(TZ_ROME)
    date_str = now_rome.date().isoformat()
    
    # JSON
    json_file = SCRIPTS_DIR / f"{date_str}-scripts.json"
    with open(json_file, "w", encoding="utf-8") as f:
        json.dump(scripts, f, ensure_ascii=False, indent=2)
    print(f"✅ Scripts saved to {json_file}")
    
    # Markdown
    for script in scripts:
        md_content = f"""# 🎬 Reel Script #{script.get('script_id')}
**{script.get('title')}**

## Info
- **Duration:** {script.get('duration_seconds')}s
- **Trend:** {script.get('trend_connection')}
- **Difficulty:** {script.get('difficulty')}
- **Est. Views:** {script.get('estimated_views')}

## Hook (0-3s)
**"{script.get('hook', {}).get('text')}"**

Visual: {script.get('hook', {}).get('visual')}

## Middle Sections
"""
        for section in script.get('middle', []):
            md_content += f"""
### {section.get('seconds')}
**{section.get('text')}**

Visual: {section.get('visual')}  
Transition: `{section.get('transition')}`
"""
        
        md_content += f"""

## Call-to-Action ({script.get('cta', {}).get('seconds')})
**{script.get('cta', {}).get('text')}**

Visual: {script.get('cta', {}).get('visual')}

## Production Details

### Music
{script.get('music_suggestion')}

### Equipment
- {chr(10).join(['- ' + item for item in script.get('equipment_needed', [])])}

### Editing Tips
1. {chr(10).join(['1. ' + tip if i == 0 else f'{i+1}. ' + tip for i, tip in enumerate(script.get('editing_tips', []))])}

### Hashtags
{' '.join(script.get('hashtags', []))}

---
*Generated at {now_rome.isoformat()}*
"""
        
        md_file = SCRIPTS_DIR / f"{date_str}-script-{script.get('script_id')}.md"
        md_file.write_text(md_content, encoding="utf-8")
        print(f"✅ Markdown script saved: {md_file}")


def main():
    print("\n🎬 NeatX Reel Script Generator")
    print("=" * 50)
    
    trends, calendar = load_context()
    print(f"✓ Loaded context")
    
    scripts = generate_reel_scripts(trends, calendar)
    
    if not scripts:
        print("❌ No scripts generated")
        return
    
    print(f"\n📝 Generated {len(scripts)} reel scripts")
    for script in scripts:
        print(f"   {script.get('script_id')}. {script.get('title')} ({script.get('duration_seconds')}s)")
    
    save_scripts(scripts)
    
    print("\n✅ Reel scripts ready for filming!")


if __name__ == "__main__":
    main()
