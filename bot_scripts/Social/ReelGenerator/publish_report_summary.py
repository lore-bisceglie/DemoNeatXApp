import json
import os
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


REPORT_PATH = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "publish_report.json")


def simple_error(platform: str, raw_message: str) -> str:
    message = (raw_message or "").lower()
    if platform == "youtube":
        if any(token in message for token in ("token", "client_secret", "credenzial", "id video")):
            return "L'accesso a YouTube è mancante o scaduto."
        return "YouTube non ha completato la pubblicazione."
    if platform == "instagram":
        if "elaborazione" in message or "container" in message or "timeout" in message:
            return "Instagram non ha completato l'elaborazione del video."
        if "copertina" in message:
            return "Instagram non è riuscito a leggere la copertina."
        return "Instagram non ha completato la pubblicazione."
    if platform == "tiktok":
        if "webhook" in message or "make.com" in message or "connessione" in message:
            return "Il collegamento automatico con TikTok non ha ricevuto il video."
        return "TikTok non ha ricevuto il video."
    return "Il tentativo non è riuscito."


def format_result(platform: str, result: dict) -> str:
    label = {"instagram": "Instagram", "tiktok": "TikTok", "youtube": "YouTube"}.get(
        platform, platform.capitalize()
    )
    if result.get("ok"):
        if platform == "tiktok":
            return "🕓 TikTok: video consegnato. Potrebbe comparire sul profilo tra qualche minuto."
        if platform == "youtube" and result.get("youtube_id"):
            return f"✅ YouTube: video online — https://youtu.be/{result['youtube_id']}"
        return f"✅ {label}: video online."
    return f"⚠️ {label}: video non pubblicato.\n   Motivo: {simple_error(platform, result.get('message', ''))}"


if not os.path.exists(REPORT_PATH):
    print("ℹ️ Nessun nuovo video elaborato in questo turno.")
    raise SystemExit(0)

try:
    with open(REPORT_PATH, encoding="utf-8") as report_file:
        report = json.load(report_file)
except (OSError, json.JSONDecodeError):
    print("⚠️ Il bot ha terminato il turno, ma non è riuscito a leggere il riepilogo.")
    raise SystemExit(0)

results = report.get("results", {})
visible_results = [(name, results[name]) for name in ("instagram", "tiktok", "youtube") if name in results]
if not visible_results:
    print("ℹ️ Nessuna piattaforma è stata elaborata in questo turno.")
    raise SystemExit(0)

success_count = sum(1 for _, result in visible_results if result.get("ok"))
total_count = len(visible_results)
heading = (
    "✅ Pubblicazione completata"
    if success_count == total_count
    else "⚠️ Pubblicazione completata solo in parte"
    if success_count
    else "❌ Video non pubblicato"
)

print(heading)
print()
for platform, result in visible_results:
    print(format_result(platform, result))
print()
print(f"Risultato: {success_count} su {total_count} piattaforme hanno ricevuto il video.")
if success_count != total_count:
    print("Le pubblicazioni riuscite restano valide. La piattaforma segnalata verrà ritentata con il prossimo video.")
