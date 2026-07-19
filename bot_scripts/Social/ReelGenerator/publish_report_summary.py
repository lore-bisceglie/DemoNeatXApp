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
            return "accesso YouTube mancante o scaduto."
        return "YouTube non ha completato la pubblicazione."
    if platform == "instagram":
        if "elaborazione" in message or "container" in message or "timeout" in message:
            return "Instagram non ha completato l'elaborazione del video."
        if "copertina" in message:
            return "Instagram non è riuscito a leggere la copertina."
        return "Instagram non ha completato la pubblicazione."
    if platform == "tiktok":
        if "non confermata" in message:
            return "Make.com ha ricevuto il video, ma TikTok non ha confermato il post."
        if "webhook" in message or "make.com" in message or "connessione" in message:
            return "il collegamento automatico con TikTok non ha ricevuto il video."
        return "TikTok non ha ricevuto o confermato il video."
    return "il tentativo non è riuscito."


def format_result(platform: str, result: dict) -> str:
    label = {"instagram": "Instagram", "tiktok": "TikTok", "youtube": "YouTube"}.get(
        platform, platform.capitalize()
    )

    if result.get("ok"):
        if platform == "youtube" and result.get("youtube_id"):
            return f"✅ YouTube: video online — https://youtu.be/{result['youtube_id']}"
        if platform == "tiktok" and result.get("url"):
            return f"✅ TikTok: video online — {result['url']}"
        if platform == "tiktok" and result.get("post_id"):
            return f"✅ TikTok: pubblicazione confermata, ID post {result['post_id']}."
        return f"✅ {label}: video online."

    if result.get("pending_confirmation"):
        return (
            "🕓 TikTok: video consegnato a Make.com, ma pubblicazione non confermata.\n"
            "   Azione richiesta: controlla lo scenario Make.com e fai restituire a NeatX un URL o ID reale del post TikTok."
        )

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

online_count = sum(1 for _, result in visible_results if result.get("ok"))
pending_count = sum(1 for _, result in visible_results if result.get("pending_confirmation"))
total_count = len(visible_results)

if online_count == total_count:
    heading = "✅ Pubblicazione completata"
elif online_count or pending_count:
    heading = "⚠️ Pubblicazione completata solo in parte"
else:
    heading = "❌ Video non pubblicato"

print(heading)
print()
for platform, result in visible_results:
    print(format_result(platform, result))
print()
print(f"Risultato: {online_count} su {total_count} piattaforme hanno confermato il video online.")
if pending_count:
    print("Una piattaforma ha ricevuto il video ma non ha confermato la pubblicazione: non viene conteggiata come online.")
if online_count != total_count:
    print("Le pubblicazioni confermate restano valide. Le piattaforme non confermate vanno controllate prima di considerare il turno completato.")
