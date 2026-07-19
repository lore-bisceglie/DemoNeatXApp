import html
import os
import sys

import requests
from dotenv import load_dotenv


if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

load_dotenv()
TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID")


def send(title, message, emoji="", parse_mode=""):
    if not TOKEN or not CHAT_ID:
        print("[!] Credenziali Telegram mancanti: notifica non inviata")
        return False

    parse_mode = parse_mode if parse_mode in {"HTML", "Markdown", "MarkdownV2"} else ""
    if parse_mode == "HTML":
        text = f"{emoji} <b>{html.escape(title)}</b>\n\n{message}"
    elif parse_mode.startswith("Markdown"):
        text = f"{emoji} *{title}*\n\n{message}"
    else:
        text = f"{emoji} {title}\n\n{message}".strip()

    payload = {"chat_id": CHAT_ID, "text": text, "disable_web_page_preview": True}
    if parse_mode:
        payload["parse_mode"] = parse_mode

    try:
        response = requests.post(
            f"https://api.telegram.org/bot{TOKEN}/sendMessage", json=payload, timeout=10
        )
        if response.ok:
            print(f"[+] Notifica Telegram inviata: {title}")
        else:
            print(f"[!] Telegram non ha accettato la notifica (codice {response.status_code})")
        return response.ok
    except requests.RequestException:
        print("[!] Telegram non raggiungibile: notifica non inviata")
        return False


def workflow_result(workflow_name, results: dict):
    ok_count = sum(1 for result in results.values() if result.get("ok"))
    total = len(results)
    status = "OK" if ok_count == total else "ATTENZIONE" if ok_count else "ERRORE"
    lines = [
        f"- {name}: {'completato' if result.get('ok') else 'richiede attenzione'}"
        for name, result in results.items()
    ]
    return send(
        workflow_name,
        f"{status}: {ok_count} su {total} operazioni completate\n\n" + "\n".join(lines),
        f"[{status}]",
    )


if __name__ == "__main__":
    send(
        sys.argv[1] if len(sys.argv) > 1 else "Notifica NeatX",
        sys.argv[2] if len(sys.argv) > 2 else "Nessun dettaglio disponibile.",
        sys.argv[3] if len(sys.argv) > 3 else "[NeatX]",
        sys.argv[4] if len(sys.argv) > 4 else "",
    )
