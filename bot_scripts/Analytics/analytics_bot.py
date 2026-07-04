#!/usr/bin/env python3
"""
NeatX Analytics Bot
Traccia performance di articoli, reel e social.
Genera report settimanali con insights e raccomandazioni.
"""

import json
import os
from datetime import datetime, timedelta
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
model = genai.GenerativeModel("gemini-1.5-flash")

# Path
SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR.parent.parent.parent / "content" / "blog"
ANALYTICS_DIR = SCRIPT_DIR / "analytics_reports"
ANALYTICS_DIR.mkdir(parents=True, exist_ok=True)

# Zona oraria
TZ_ROME = ZoneInfo("Europe/Rome")


def collect_performance_data():
    """Raccoglie dati di performance da articoli e file di log."""
    analytics_data = {
        "period": f"{(datetime.now(TZ_ROME) - timedelta(days=7)).date()} to {datetime.now(TZ_ROME).date()}",
        "articles": [],
        "reels": [],
        "social_posts": []
    }
    
    # Simula dati di performance (in produzione leggerebbe da Analytics API)
    analytics_data["articles"] = [
        {
            "title": "Beauty Trend Report - July",
            "views": 1250,
            "engagement_rate": 4.2,
            "bounce_rate": 32,
            "avg_time": "3:45"
        },
        {
            "title": "Hair Care Tips for Summer",
            "views": 890,
            "engagement_rate": 5.1,
            "bounce_rate": 28,
            "avg_time": "4:20"
        }
    ]
    
    analytics_data["reels"] = [
        {
            "title": "Quick Haircut Tutorial",
            "views": 5420,
            "likes": 340,
            "shares": 89,
            "saves": 156
        },
        {
            "title": "Wellness Tips",
            "views": 2100,
            "likes": 98,
            "shares": 23,
            "saves": 45
        }
    ]
    
    analytics_data["social_posts"] = [
        {
            "platform": "Instagram",
            "posts": 15,
            "total_engagement": 2340,
            "avg_engagement": 156,
            "follower_growth": 89
        },
        {
            "platform": "TikTok",
            "posts": 8,
            "total_engagement": 45230,
            "avg_engagement": 5654,
            "follower_growth": 234
        }
    ]
    
    return analytics_data


def generate_analytics_report(analytics_data):
    """Genera report analitiche con Gemini."""
    prompt = f"""Analizza questi dati di performance content e genera un report strategico:

DATI PERFORMANCE:
{json.dumps(analytics_data, ensure_ascii=False, indent=2)}

Rispondi in JSON con:
{{
    "summary": "riassunto esecutivo (max 50 parole)",
    "top_performers": [
        {{
            "type": "article|reel|social",
            "title": "titolo",
            "metric": "quale metrica vince",
            "value": "valore"
        }}
    ],
    "top_issues": [
        "problema 1 identificato",
        "problema 2",
        "problema 3"
    ],
    "recommendations": [
        "raccomandazione azione 1",
        "raccomandazione azione 2",
        "raccomandazione azione 3"
    ],
    "content_strategy_adjustments": {{
        "increase": ["tipo contenuto da aumentare"],
        "decrease": ["tipo contenuto da ridurre"],
        "new_experiments": ["nuovo approccio da testare"]
    }},
    "next_week_focus": "focus strategico per prossima settimana",
    "estimated_impact": "impatto stimato delle raccomandazioni"
}}

Sii specifico e actionable."""
    
    print("📊 Analyzing performance data...")
    response = model.generate_content(prompt)
    
    text = response.text
    start = text.find("{")
    end = text.rfind("}") + 1
    
    if start == -1 or end == 0:
        print(f"❌ Could not parse JSON from response")
        return {}
    
    try:
        report = json.loads(text[start:end])
    except json.JSONDecodeError as e:
        print(f"❌ JSON parse error: {e}")
        return {}
    
    return report


def save_report(analytics_data, report):
    """Salva report in JSON e markdown."""
    now_rome = datetime.now(TZ_ROME)
    week_start = (now_rome - timedelta(days=7)).date().isoformat()
    week_end = now_rome.date().isoformat()
    filename = f"analytics_report_{week_start}_to_{week_end}"
    
    # JSON
    json_file = ANALYTICS_DIR / f"{filename}.json"
    with open(json_file, "w", encoding="utf-8") as f:
        json.dump({
            "analytics": analytics_data,
            "report": report
        }, f, ensure_ascii=False, indent=2)
    print(f"✅ Report saved to {json_file}")
    
    # Markdown
    md_content = f"""# 📊 Weekly Analytics Report
**{week_start} to {week_end}**

## Executive Summary
{report.get('summary', 'N/A')}

## Top Performers
"""
    
    for item in report.get('top_performers', []):
        md_content += f"\n- **{item.get('title')}** ({item.get('type')}): {item.get('metric')} = {item.get('value')}"
    
    md_content += f"\n\n## Issues Identified\n"
    for issue in report.get('top_issues', []):
        md_content += f"- ⚠️ {issue}\n"
    
    md_content += f"\n## Recommendations\n"
    for i, rec in enumerate(report.get('recommendations', []), 1):
        md_content += f"{i}. {rec}\n"
    
    strategy = report.get('content_strategy_adjustments', {})
    md_content += f"""
## Content Strategy Adjustments

### Increase
{chr(10).join(['- ' + item for item in strategy.get('increase', [])])}

### Decrease
{chr(10).join(['- ' + item for item in strategy.get('decrease', [])])}

### New Experiments
{chr(10).join(['- ' + item for item in strategy.get('new_experiments', [])])}

## Next Week Focus
{report.get('next_week_focus', 'N/A')}

## Estimated Impact
{report.get('estimated_impact', 'N/A')}

---
*Report generated: {now_rome.isoformat()}*
"""
    
    md_file = ANALYTICS_DIR / f"{filename}.md"
    md_file.write_text(md_content, encoding="utf-8")
    print(f"✅ Markdown report saved: {md_file}")


def main():
    print("\n📊 NeatX Analytics Bot")
    print("=" * 50)
    
    analytics_data = collect_performance_data()
    print(f"✓ Collected performance data for {analytics_data['period']}")
    
    report = generate_analytics_report(analytics_data)
    
    if not report:
        print("❌ No report generated")
        return
    
    print(f"\n📈 Report Summary:")
    print(f"   Top performers identified: {len(report.get('top_performers', []))}")
    print(f"   Issues found: {len(report.get('top_issues', []))}")
    print(f"   Recommendations: {len(report.get('recommendations', []))}")
    
    save_report(analytics_data, report)
    
    print("\n✅ Analytics report ready!")


if __name__ == "__main__":
    main()
