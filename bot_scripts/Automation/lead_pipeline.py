import csv
import json
import os
import requests
from dotenv import load_dotenv
load_dotenv()

from datetime import datetime
from pathlib import Path

from ai_provider import openai_json

try:
    from google import genai
    from google.genai import types
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
    "Bologna",
    "Firenze",
    "Verona",
    "Brescia",
]

DEFAULT_NICHES = [
    "fisioterapisti",
    "personal trainer",
    "centri estetici",
    "tatuatori",
    "osteopati",
    "nutrizionisti",
    "psicologi",
    "parrucchieri",
    "barbieri",
    "consulenti"
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
    client = genai.Client(api_key=api_key)
    return client


def build_targets(brief):
    import random
    niche = (brief.get("niche") or random.choice(DEFAULT_NICHES)).lower()
    pain = brief.get("pain") or "la gestione manuale degli appuntamenti e i clienti che non si presentano"
    promise = brief.get("promise") or "avere un'agenda automatica h24 e azzerare i no-show"

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
            "Ehi ciao! Ho visto il tuo profilo, complimenti. "
            "Ti scrivo al volo perché ho lanciato NeatX, un'app che ti gestisce in automatico tutte le prenotazioni senza farti impazzire al telefono. "
            "Ti lascio il link, ci metti 2 minuti a farti la tua agenda online da zero: https://www.neatx.store/ "
            "Fammi sapere che ne pensi!"
        ),
        "follow_up": (
            "Ciao! Ti lascio di nuovo il link nel caso ti fosse sfuggito, avere la pagina prenotazioni h24 ti salva un sacco di tempo: https://www.neatx.store/"
        ),
        "comment_reply": (
            "Te la mando volentieri. Scrivimi AGENDA in DM e ti giro il link della demo NeatX."
        ),
    }


def generate_messages(brief, rows):
    prompt = {
        "task": "Scrivi messaggi brevi per prospect B2B italiani.",
        "product": "NeatX, app per prenotazioni automatiche online, promemoria e riduzione no-show.",
        "rules": [
            "Scrivi in modo ESTREMAMENTE informale e casuale, come se scrivessi a un conoscente su Instagram.",
            "NIENTE linguaggio corporate, niente parole come 'ottimizzare', 'soluzione', 'settore', 'professionisti'.",
            "Usa un tono diretto, amichevole e umano. Frasi corte.",
            "Niente schema 'Problema -> Soluzione', sii molto più colloquiale.",
            "Niente emoji.",
            "Massimo 420 caratteri per messaggio.",
            "Il messaggio 'dm_1' e 'follow_up' devono SEMPRE contenere il link esatto: https://www.neatx.store/",
            "L'obiettivo è farli registrare dal link in modo naturale, senza spingere troppo come un venditore."
        ],
        "today_brief": brief,
        "target_rows": rows[:3],
        "output_schema": {
            "dm_1": "primo messaggio Instagram",
            "follow_up": "follow-up leggero",
            "comment_reply": "risposta a chi commenta AGENDA",
        },
    }

    data = openai_json(prompt, max_tokens=900)
    if isinstance(data, dict) and all(data.get(key) for key in ("dm_1", "follow_up", "comment_reply")):
        print("[Lead Pipeline] Messaggi generati con OpenAI.")
        return data

    client = setup_gemini()
    if client is None:
        return fallback_messages(brief, rows)

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=json.dumps(prompt, ensure_ascii=False)
        )
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        
        data = json.loads(text)
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

    # Invia notifica Telegram
    bot_token = os.environ.get("TELEGRAM_BOT_TOKEN")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID")
    if bot_token and chat_id:
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        
        # Split messages for easy copying on mobile Telegram
        msg_parts = [
            f"📩 *Primo Messaggio (DM 1)*:\n(Copia il messaggio qui sotto 👇)",
            messages['dm_1'],
            f"👋 *Follow Up*:\n(Copia il messaggio qui sotto 👇)",
            messages['follow_up'],
            f"💬 *Risposta ai Commenti*:\n(Copia il messaggio qui sotto 👇)",
            messages['comment_reply'],
            "🔍 *Target di Oggi*:\n" + "\n".join([f"- {r['search_query']} ({r['priority']})" for r in rows])
        ]
        
        for i, part in enumerate(msg_parts):
            try:
                payload = {
                    "chat_id": chat_id, 
                    "text": part, 
                    "parse_mode": "Markdown"
                }
                # Suona solo al primo messaggio, gli altri arrivano silenziosi
                if i > 0:
                    payload["disable_notification"] = True
                    
                requests.post(url, json=payload)
            except Exception as e:
                print(f"[Lead Pipeline] Errore invio Telegram: {e}")
                
        print("[Lead Pipeline] Messaggi inviati su Telegram con successo in bolle separate!")


if __name__ == "__main__":
    main()
