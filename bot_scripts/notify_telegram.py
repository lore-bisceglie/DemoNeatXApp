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


def send(title, message, emoji="", parse_mode="", silent=False):
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
    if silent:
        payload["disable_notification"] = True

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


def workflow_status(name, status, log_file=None):
    """Send a Telegram notification based on GitHub Actions job status.
    
    Args:
        name: Workflow display name
        status: 'success', 'failure', or 'cancelled'
        log_file: Optional path to a log file to include on failure
    """
    if status == "success":
        return send(name, "Completato con successo.", "✅", silent=True)
    
    # Read last 40 lines of log file for error context
    log_tail = ""
    if log_file and os.path.exists(log_file):
        try:
            with open(log_file, "r", encoding="utf-8", errors="replace") as f:
                lines = f.readlines()
                # Take last 40 lines, cap at 3500 chars (Telegram limit is 4096)
                tail = "".join(lines[-40:])
                log_tail = tail[-3500:] if len(tail) > 3500 else tail
        except Exception:
            log_tail = "(Impossibile leggere il log)"
    
    emoji = "❌" if status == "failure" else "⚠️"
    label = "FALLITO" if status == "failure" else "ANNULLATO"

    # Spiegazione chiara quando il fallimento è dovuto al blocco Meta
    # (Instagram/Facebook API): evita di mostrare solo un log criptico.
    meta_hint = ""
    if status == "failure" and log_tail:
        lower = log_tail.lower()
        if any(keyword in lower for keyword in [
            "error_code", "oauthexception", "session has expired",
            "access token", "permission", "meta", "instagram", "graph.facebook",
            "unauthorized", "invalid token", "app not setup", "rate limit",
        ]):
            meta_hint = (
                "\n\n⚠️ <b>Causa probabile: problema con l'API Meta (Instagram/Facebook).</b>\n"
                "Il token è scaduto o l'account è bloccato da Meta. "
                "Verifica il token in Vercel/GitHub Secrets o contatta il supporto Meta."
            )

    if log_tail:
        message = f"{label}\n\n--- Log Errore ---\n{log_tail}{meta_hint}"
    else:
        message = f"{label} — Controlla i log su GitHub Actions.{meta_hint}"

    return send(name, message, emoji)


if __name__ == "__main__":
    # Mode 1: --workflow "Name" --status success|failure [--log /path/to/log]
    if "--workflow" in sys.argv:
        import argparse
        parser = argparse.ArgumentParser()
        parser.add_argument("--workflow", required=True)
        parser.add_argument("--status", required=True)
        parser.add_argument("--log", default=None)
        args = parser.parse_args()
        workflow_status(args.workflow, args.status, args.log)
    else:
        # Mode 2: Legacy positional args
        send(
            sys.argv[1] if len(sys.argv) > 1 else "Notifica NeatX",
            sys.argv[2] if len(sys.argv) > 2 else "Nessun dettaglio disponibile.",
            sys.argv[3] if len(sys.argv) > 3 else "[NeatX]",
            sys.argv[4] if len(sys.argv) > 4 else "",
        )
