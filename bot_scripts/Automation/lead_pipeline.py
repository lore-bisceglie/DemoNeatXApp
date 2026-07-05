import csv
import json
import os
from datetime import datetime
from pathlib import Path

try:
    import google.generativeai as genai
except Exception:
    genai = None


APP_DIR = Path(__file__).resolve().parents[2]
CONTENT_DIR = APP_DIR / "content_strategy"
LEADS_DIR = APP_DIR / "leads"
TODAY_BRIEF = CONTENT_DIR / "today_brief.json"

DEFAULT_CITIES = [
    "Milano",
    "Roma",
    "Torino",
    "Napoli",
    "Bologna",
    "Firenze",
    "Verona",
    "Brescia",
]


def load_today_brief():
    if TODAY_BRIEF.exists():
        try:
            return json.loads(TODAY_BRIEF.read_text(encoding="utf-8"))
        except Exception as exc:
            print(f"[Lead Pipeline] Brief non leggibile: {exc}")
    return {}


def setup_gemini():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key or genai is None:
        return None
    genai.configure(api_key=api_key)
    return genai.GenerativeModel(
        "gemini-2.5-flash",
        generation_config={"response_mime_type": "application/json"},
    )


def build_targets(brief):
    niche = (brief.get("niche") or "parrucchieri").lower()
    pain = brief.get("pain") or "gestione manuale degli appuntamenti"
    promise = brief.get("promise") or "prenotazioni automatiche e meno no-show"

    rows = []
    for city in DEFAULT_CITIES:
        rows.append(
            {
                "date": datetime.now().strftime("%Y-%m-%d"),
                "niche": niche,
                "city": city,
                "search_query": f"{niche} {city}",
                "priority": "alta" if city in {"Milano", "Roma", "Torino"} else "media",
                "pain": pain,
                "promise": promise,
                "status": "da cercare",
            }
        )
    return rows


def fallback_messages(brief, rows):
    niche = brief.get("niche") or rows[0]["niche"]
    pain = brief.get("pain") or "perdere tempo tra messaggi e telefonate"
    promise = brief.get("promise") or "riempire l'agenda con prenotazioni automatiche"
    return {
        "dm_1": (
            f"Ciao! Ho visto che lavori nel settore {niche}. "
            f"Molti professionisti perdono ore ogni settimana per {pain}. "
            f"Con NeatX puoi {promise}. Vuoi che ti mandi una demo veloce?"
        ),
        "follow_up": (
            "Ti lascio un'idea concreta: pagina prenotazioni sempre attiva, "
            "promemoria automatici e meno appuntamenti persi. Se vuoi, ti mando il link demo."
        ),
        "comment_reply": (
            "Te la mando volentieri. Scrivimi AGENDA in DM e ti giro il link della demo NeatX."
        ),
    }


def generate_messages(brief, rows):
    model = setup_gemini()
    if model is None:
        return fallback_messages(brief, rows)

    prompt = {
        "task": "Scrivi messaggi brevi per prospect B2B italiani.",
        "product": "NeatX, app per prenotazioni automatiche online, promemoria e riduzione no-show.",
        "rules": [
            "Tono umano, diretto, non spam.",
            "Nessuna promessa falsa.",
            "Niente emoji.",
            "Massimo 420 caratteri per messaggio.",
        ],
        "today_brief": brief,
        "target_rows": rows[:3],
        "output_schema": {
            "dm_1": "primo messaggio Instagram",
            "follow_up": "follow-up leggero",
            "comment_reply": "risposta a chi commenta AGENDA",
        },
    }

    try:
        response = model.generate_content(json.dumps(prompt, ensure_ascii=False))
        data = json.loads(response.text)
        if all(data.get(key) for key in ("dm_1", "follow_up", "comment_reply")):
            return data
    except Exception as exc:
        print(f"[Lead Pipeline] Gemini non disponibile per i messaggi: {exc}")

    return fallback_messages(brief, rows)


def write_outputs(rows, messages):
    LEADS_DIR.mkdir(parents=True, exist_ok=True)
    today = datetime.now().strftime("%Y-%m-%d")
    csv_path = LEADS_DIR / f"lead_targets_{today}.csv"
    md_path = LEADS_DIR / f"lead_messages_{today}.md"

    with csv_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    lines = [
        f"# Lead Pipeline NeatX - {today}",
        "",
        "## Messaggio iniziale",
        messages["dm_1"],
        "",
        "## Follow-up",
        messages["follow_up"],
        "",
        "## Risposta commento",
        messages["comment_reply"],
        "",
        "## Ricerche consigliate",
    ]
    for row in rows:
        lines.append(f"- {row['search_query']} | priorita {row['priority']} | {row['status']}")

    md_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"[Lead Pipeline] Salvato {csv_path}")
    print(f"[Lead Pipeline] Salvato {md_path}")


def main():
    brief = load_today_brief()
    rows = build_targets(brief)
    messages = generate_messages(brief, rows)
    write_outputs(rows, messages)


if __name__ == "__main__":
    main()
