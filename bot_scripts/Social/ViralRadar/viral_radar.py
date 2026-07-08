#!/usr/bin/env python3
"""
NeatX Viral Radar
Scansiona trend virali, idee per reel e competitor insights.
Integra Instagram insights + Gemini per analisi semantic.
"""

import json
import os
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

try:
    import google.generativeai as genai
except ImportError:
    print("⚠️  google-generativeai not installed. Install with: pip install google-generativeai")
    exit(1)

# Configurazione
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("❌ GEMINI_API_KEY not set")
    exit(1)

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-pro")

# Path
SCRIPT_DIR = Path(__file__).parent
TRENDS_FILE = SCRIPT_DIR / "trending_ideas.json"
INSIGHTS_FILE = SCRIPT_DIR / "radar_insights.json"
COMPETITOR_FILE = SCRIPT_DIR / "competitor_analysis.json"

# Zona oraria
TZ_ROME = ZoneInfo("Europe/Rome")


def scan_viral_trends():
    """Genera idee virali per settore Beauty/Parrucchieri usando Gemini."""
    prompt = """Analizza i 5 trend virali ATTUALI (Luglio 2026) per il settore Beauty, Parrucchieri e Wellness su Instagram/TikTok.
    
Rispondi in JSON con questa struttura:
{
    "scan_date": "2026-07-04",
    "trends": [
        {
            "rank": 1,
            "trend_name": "nome trend",
            "description": "descrizione breve",
            "relevance": "altissima|alta|media",
            "reel_angle": "come spiegarlo in reel",
            "growth_potential": "percentuale stima",
            "hashtags": ["hashtag1", "hashtag2"],
            "audience_engagement": "alto|medio|basso"
        }
    ],
    "opportunities": ["opportunità 1", "opportunità 2", "opportunità 3"],
    "warnings": ["cosa evitare 1", "cosa evitare 2"]
}

Sii specifico per parrucchieri e beauty. Includi dati reali se possibile."""
    
    print("🔍 Scanning viral trends...")
    response = model.generate_content(prompt)
    
    text = response.text
    start = text.find("{")
    end = text.rfind("}") + 1
    
    if start == -1 or end == 0:
        print(f"❌ Could not parse JSON from response:\n{text}")
        exit(1)
    
    try:
        trends_data = json.loads(text[start:end])
    except json.JSONDecodeError as e:
        print(f"❌ JSON parse error: {e}")
        exit(1)
    
    return trends_data


def generate_reel_ideas(trends_data):
    """Genera 3 idee di reel specifiche basate sui trend."""
    trends_summary = "\n".join([
        f"- {t['trend_name']}: {t['description']}" 
        for t in trends_data.get('trends', [])[:3]
    ])
    
    prompt = f"""Basandoti su questi trend virali:
{trends_summary}

Genera 3 idee concrete per reel Instagram per parrucchieri/beauty:

Formato JSON:
{{
    "reel_ideas": [
        {{
            "title": "titolo breve",
            "hook": "apertura accattivante (max 10 sec)",
            "main_content": "cosa succede nei secondi centrali",
            "cta": "call-to-action finale",
            "duration_seconds": 30,
            "trend_connection": "quale trend sfrutta",
            "equipment_needed": ["cosa serve"],
            "difficulty": "facile|medio|difficile"
        }}
    ]
}}

Sii pratico e realizzabile."""
    
    print("💡 Generating reel ideas...")
    response = model.generate_content(prompt)
    
    text = response.text
    start = text.find("{")
    end = text.rfind("}") + 1
    
    if start == -1 or end == 0:
        print(f"⚠️  Could not parse reel ideas, continuing...")
        return {"reel_ideas": []}
    
    try:
        reel_data = json.loads(text[start:end])
    except json.JSONDecodeError:
        print(f"⚠️  Could not parse reel ideas, continuing...")
        return {"reel_ideas": []}
    
    return reel_data


def analyze_competitors(trends_data):
    """Analizza cosa stanno facendo i competitor."""
    prompt = f"""Nel settore parrucchieri/beauty, quali account stanno sfruttando meglio questi trend:
{json.dumps(trends_data.get('trends', [])[:3], ensure_ascii=False)}

Rispondi in JSON:
{{
    "competitor_insights": {{
        "top_strategies": ["strategia 1", "strategia 2", "strategia 3"],
        "common_mistakes": ["errore 1", "errore 2"],
        "gaps": ["gap di mercato 1", "gap 2"],
        "opportunities_we_can_exploit": ["opportunità 1", "opportunità 2"]
    }}
}}

Sii specifico su cosa NEATX può fare meglio."""
    
    print("📊 Analyzing competitor landscape...")
    response = model.generate_content(prompt)
    
    text = response.text
    start = text.find("{")
    end = text.rfind("}") + 1
    
    if start == -1 or end == 0:
        print(f"⚠️  Could not parse competitor analysis, continuing...")
        return {"competitor_insights": {}}
    
    try:
        comp_data = json.loads(text[start:end])
    except json.JSONDecodeError:
        print(f"⚠️  Could not parse competitor analysis, continuing...")
        return {"competitor_insights": {}}
    
    return comp_data


def save_results(trends_data, reel_data, comp_data):
    """Salva tutti i risultati in JSON."""
    with open(TRENDS_FILE, "w", encoding="utf-8") as f:
        json.dump(trends_data, f, ensure_ascii=False, indent=2)
    print(f"✅ Trends saved to {TRENDS_FILE}")
    
    with open(INSIGHTS_FILE, "w", encoding="utf-8") as f:
        json.dump(reel_data, f, ensure_ascii=False, indent=2)
    print(f"✅ Reel ideas saved to {INSIGHTS_FILE}")
    
    with open(COMPETITOR_FILE, "w", encoding="utf-8") as f:
        json.dump(comp_data, f, ensure_ascii=False, indent=2)
    print(f"✅ Competitor analysis saved to {COMPETITOR_FILE}")


def main():
    print("\n🔍 NeatX Viral Radar")
    print("=" * 50)
    
    trends_data = scan_viral_trends()
    print(f"\n📈 Top trends found:")
    for trend in trends_data.get('trends', [])[:3]:
        print(f"   {trend.get('rank')}. {trend.get('trend_name')} ({trend.get('relevance')})")
    
    reel_data = generate_reel_ideas(trends_data)
    print(f"\n🎬 Reel ideas: {len(reel_data.get('reel_ideas', []))}")
    
    comp_data = analyze_competitors(trends_data)
    print(f"\n🎯 Competitor analysis complete")
    
    save_results(trends_data, reel_data, comp_data)
    
    print("\n✅ Viral Radar scan complete!")


if __name__ == "__main__":
    main()
