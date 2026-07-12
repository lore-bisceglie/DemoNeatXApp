import os
import sys
import json
import requests
from dotenv import load_dotenv

load_dotenv()

TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID")

def send(title, message, emoji="", parse_mode="Markdown"):
    if not TOKEN or not CHAT_ID:
        print("[!] TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID mancanti")
        return False

    text = f"{emoji} *{title}*\n\n{message}"
    try:
        r = requests.post(
            f"https://api.telegram.org/bot{TOKEN}/sendMessage",
            json={
                "chat_id": CHAT_ID,
                "text": text,
                "parse_mode": parse_mode,
                "disable_web_page_preview": True,
            },
            timeout=10,
        )
        if r.ok:
            print(f"[+] Notifica Telegram inviata: {title}")
        else:
            print(f"[!] Telegram error: {r.text}")
        return r.ok
    except Exception as e:
        print(f"[!] Telegram send failed: {e}")
        return False

def workflow_result(workflow_name, results: dict):
    lines = [f"`{k}`: {'✅' if v.get('ok') else '❌'} {v.get('message', '')}" for k, v in results.items()]
    ok_count = sum(1 for v in results.values() if v.get("ok"))
    total = len(results)
    status = "✅" if ok_count == total else "⚠️" if ok_count > 0 else "❌"
    summary = f"{status} {workflow_name}\n\n" + "\n".join(lines)
    return send(workflow_name, summary, status)

if __name__ == "__main__":
    title = sys.argv[1] if len(sys.argv) > 1 else "Notifica NeatX"
    message = sys.argv[2] if len(sys.argv) > 2 else "(nessun messaggio)"
    emoji = sys.argv[3] if len(sys.argv) > 3 else "🤖"
    send(title, message, emoji)
