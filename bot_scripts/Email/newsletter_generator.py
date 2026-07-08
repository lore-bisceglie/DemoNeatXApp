#!/usr/bin/env python3
"""
NeatX Email Newsletter Generator
Trasforma best-of della settimana in newsletter HTML.
Raccomanda articoli top per segmenti audience.
Pronto per invio con Brevo/SendGrid.
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
ANALYTICS_DIR = SCRIPT_DIR.parent / "Analytics" / "analytics_reports"
NEWSLETTERS_DIR = SCRIPT_DIR / "newsletters"
NEWSLETTERS_DIR.mkdir(parents=True, exist_ok=True)

# Zona oraria
TZ_ROME = ZoneInfo("Europe/Rome")


def get_weekly_highlights():
    """Raccoglie i contenuti top della settimana."""
    now_rome = datetime.now(TZ_ROME)
    week_start = (now_rome - timedelta(days=7)).date().isoformat()
    
    highlights = {
        "week": f"{week_start} to {now_rome.date().isoformat()}",
        "top_articles": [
            {
                "title": "7 Trend Virali Luglio 2026",
                "url": "https://demo-neatx.it/blog/trend-luglio-2026",
                "views": 1250,
                "summary": "Scopri i trend virali che stanno dominando Instagram e TikTok per il settore beauty."
            },
            {
                "title": "Hair Care Routine Estiva",
                "url": "https://demo-neatx.it/blog/hair-care-estate",
                "views": 890,
                "summary": "Consigli pratici per mantenere i capelli sani durante l'estate."
            }
        ],
        "top_reels": [
            {
                "title": "Quick Haircut Transformation",
                "views": 5420,
                "engagement": 4.2
            },
            {
                "title": "Wellness Challenge Results",
                "views": 2100,
                "engagement": 3.8
            }
        ],
        "announcements": [
            "Nuovo servizio Premium lanciato questa settimana",
            "Partner con influencer locale confermato",
            "App mobile in beta testing"
        ]
    }
    
    return highlights


def generate_newsletter_content(highlights):
    """Genera contenuto newsletter con Gemini."""
    prompt = f"""Genera il contenuto di una newsletter settimanale (HTML-friendly) basato su questi highlights:

{json.dumps(highlights, ensure_ascii=False, indent=2)}

Rispondi in JSON:
{{
    "subject_line": "subject line accattivante (max 60 caratteri)",
    "preheader": "preview text (max 100 caratteri)",
    "greeting": "saluto personalizzato",
    "intro": "introduzione (2-3 righe) - cosa ha fatto bene la settimana",
    "featured_article": {{
        "title": "articolo più importante",
        "description": "teaser (50 parole)",
        "cta": "testo pulsante CTA"
    }},
    "additional_articles": [
        {{
            "title": "articolo",
            "summary": "una riga"
        }}
    ],
    "reel_highlight": {{
        "title": "reel top della settimana",
        "description": "perché è virale"
    }},
    "announcements_section": "testo con announcements",
    "segment_recommendations": {{
        "beginners": "consiglio contenuto per chi inizia",
        "intermediate": "consiglio per livello intermedio",
        "professionals": "consiglio per professionisti"
    }},
    "closing": "chiusura personale",
    "footer_social": ["link social da includere"],
    "unsubscribe_message": "testo unsubscribe GDPR compliant"
}}

Sii creativo, coinvolgente e orientato alla conversione."""
    
    print("📧 Generating newsletter content...")
    response = client.models.generate_content(model="gemini-3.5-flash", contents=prompt)
    
    text = response.text
    start = text.find("{")
    end = text.rfind("}") + 1
    
    if start == -1 or end == 0:
        print(f"❌ Could not parse JSON from response")
        return {}
    
    try:
        newsletter = json.loads(text[start:end])
    except json.JSONDecodeError as e:
        print(f"❌ JSON parse error: {e}")
        return {}
    
    return newsletter


def create_html_newsletter(newsletter, highlights):
    """Crea HTML della newsletter."""
    html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{newsletter.get('subject_line')}</title>
    <style>
        body {{ font-family: Arial, sans-serif; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }}
        .content {{ padding: 20px; }}
        .article {{ border-left: 4px solid #667eea; padding-left: 15px; margin: 15px 0; }}
        .cta-button {{ background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 0; }}
        .footer {{ background: #f5f5f5; padding: 15px; font-size: 12px; text-align: center; color: #666; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎨 NeatX Weekly Newsletter</h1>
            <p>{newsletter.get('preheader')}</p>
        </div>
        
        <div class="content">
            <p>{newsletter.get('greeting')}</p>
            
            <p>{newsletter.get('intro')}</p>
            
            <div class="article">
                <h2>{newsletter.get('featured_article', {}).get('title')}</h2>
                <p>{newsletter.get('featured_article', {}).get('description')}</p>
                <a href="#" class="cta-button">{newsletter.get('featured_article', {}).get('cta')}</a>
            </div>
            
            <h3>📚 Letture consigliate:</h3>
"""
    
    for article in newsletter.get('additional_articles', []):
        html += f"""
            <div class="article">
                <strong>{article.get('title')}</strong>
                <p>{article.get('summary')}</p>
            </div>
"""
    
    html += f"""
            <h3>🎬 Reel della settimana</h3>
            <div class="article">
                <p><strong>{newsletter.get('reel_highlight', {}).get('title')}</strong></p>
                <p>{newsletter.get('reel_highlight', {}).get('description')}</p>
            </div>
            
            <h3>📢 News</h3>
            <p>{newsletter.get('announcements_section')}</p>
            
            <h3>💡 Consigli personalizzati</h3>
            <ul>
                <li><strong>Per principianti:</strong> {newsletter.get('segment_recommendations', {}).get('beginners')}</li>
                <li><strong>Livello intermedio:</strong> {newsletter.get('segment_recommendations', {}).get('intermediate')}</li>
                <li><strong>Professionisti:</strong> {newsletter.get('segment_recommendations', {}).get('professionals')}</li>
            </ul>
            
            <p>{newsletter.get('closing')}</p>
        </div>
        
        <div class="footer">
            <p>{newsletter.get('unsubscribe_message')}</p>
        </div>
    </div>
</body>
</html>
"""
    
    return html


def save_newsletter(newsletter, html, highlights):
    """Salva newsletter in JSON e HTML."""
    now_rome = datetime.now(TZ_ROME)
    week_num = now_rome.isocalendar()[1]
    filename = f"newsletter_week_{week_num}_{now_rome.year}"
    
    # JSON
    json_file = NEWSLETTERS_DIR / f"{filename}.json"
    with open(json_file, "w", encoding="utf-8") as f:
        json.dump({
            "metadata": {
                "created_at": now_rome.isoformat(),
                "week": highlights.get('week'),
                "subject": newsletter.get('subject_line')
            },
            "content": newsletter
        }, f, ensure_ascii=False, indent=2)
    print(f"✅ Newsletter JSON saved: {json_file}")
    
    # HTML
    html_file = NEWSLETTERS_DIR / f"{filename}.html"
    html_file.write_text(html, encoding="utf-8")
    print(f"✅ Newsletter HTML saved: {html_file}")
    
    # Ready to send
    send_file = NEWSLETTERS_DIR / f"{filename}_READY_TO_SEND.txt"
    send_file.write_text(f"""NEWSLETTER PRONTA PER L'INVIO
==============================

Subject: {newsletter.get('subject_line')}
Preheader: {newsletter.get('preheader')}

File HTML: {filename}.html
File JSON: {filename}.json

Status: PRONTO PER BREVO/SENDGRID

Istruzioni:
1. Carica {filename}.html in piattaforma email
2. Seleziona lista recipients
3. Scheduled per lunedì 09:00 Rome time
4. Premi SEND

Created: {now_rome.isoformat()}
""")
    print(f"✅ Send instructions created: {send_file}")


def main():
    print("\n📧 NeatX Email Newsletter Generator")
    print("=" * 50)
    
    highlights = get_weekly_highlights()
    print(f"✓ Loaded highlights for week: {highlights['week']}")
    
    newsletter = generate_newsletter_content(highlights)
    
    if not newsletter:
        print("❌ No newsletter generated")
        return
    
    html = create_html_newsletter(newsletter, highlights)
    print(f"✓ Generated HTML newsletter")
    
    print(f"\n📰 Newsletter:")
    print(f"   Subject: {newsletter.get('subject_line')}")
    print(f"   Preheader: {newsletter.get('preheader')}")
    
    save_newsletter(newsletter, html, highlights)
    
    print("\n✅ Newsletter ready to send!")


if __name__ == "__main__":
    main()
