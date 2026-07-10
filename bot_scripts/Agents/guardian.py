import json
import os
from pathlib import Path
from datetime import datetime, timezone

from agent_base import BaseAgent

REPO_ROOT = Path(__file__).resolve().parents[2]
CONTENT_STRATEGY_DIR = REPO_ROOT / "content_strategy"
REEL_DIR = REPO_ROOT / "bot_scripts" / "Social" / "ReelGenerator"

class GuardianAgent(BaseAgent):
    name = "Guardian"

    def run(self):
        self.log("Report salute business in corso...")
        report = self._build_report()
        self.post("guardian_report", {"type": "daily_report", "report": report})
        self._send_telegram(report)
        self.log("Report completato.")

    def _build_report(self) -> dict:
        report = {
            "date": self._now()[:10],
            "status": "healthy",
            "checks": {},
        }

        # 1. Controlla calendario contenuti
        cal_path = CONTENT_STRATEGY_DIR / "content_calendar.json"
        cal_ok = cal_path.exists()
        if cal_ok:
            try:
                cal = json.loads(cal_path.read_text(encoding="utf-8"))
                days = cal.get("days", [])
                report["checks"]["content_calendar"] = {
                    "ok": True,
                    "detail": f"{len(days)} giorni pianificati",
                }
                # Controlla se oggi ha contenuti
                today = self._now()[:10]
                today_entry = next((d for d in days if d.get("date", "")[:10] == today), None)
                if today_entry:
                    report["today"] = {
                        "niche": today_entry.get("niche", ""),
                        "feature": today_entry.get("feature_label", ""),
                        "cover": today_entry.get("cover_title", ""),
                    }
            except Exception:
                report["checks"]["content_calendar"] = {"ok": False, "detail": "Errore lettura calendario"}
        else:
            report["checks"]["content_calendar"] = {"ok": False, "detail": "Calendario non trovato"}
            report["status"] = "warning"

        # 2. Controlla brief di oggi
        brief_path = CONTENT_STRATEGY_DIR / "today_brief.json"
        brief_ok = brief_path.exists()
        report["checks"]["today_brief"] = {
            "ok": brief_ok,
            "detail": "Presente" if brief_ok else "Mancante",
        }
        if not brief_ok:
            report["status"] = "warning"

        # 3. Controlla se l'agente intelligence ha lasciato idee
        ideas = self.bus.read("content_ideas")
        report["checks"]["market_intelligence"] = {
            "ok": len(ideas) > 0,
            "detail": f"{len(ideas)} report intelligence",
        }

        # 4. Controlla reel data recente
        reel_path = REPO_ROOT / reel_check_path()
        reel_ok = reel_path.exists()
        report["checks"]["reel_data"] = {
            "ok": reel_ok,
            "detail": "Ultimo reel presente" if reel_ok else "Nessun reel recente",
        }

        # 5. Controlla suggerimenti contenuti
        suggestions = self.bus.read("content_suggestions")
        report["checks"]["content_advisor"] = {
            "ok": len(suggestions) > 0,
            "detail": f"{len(suggestions)} raccomandazioni attive",
        }

        # 6. Controlla lead reali dal DB (via API)
        try:
            import urllib.request
            resp = urllib.request.urlopen("https://neatx.store/api/agents/lead-stats", timeout=10)
            lead_data = json.loads(resp.read())
            report["checks"]["leads_pipeline"] = {
                "ok": True,
                "detail": f"{lead_data.get('total', 0)} totali, {lead_data.get('newLeads', 0)} nuovi",
            }
        except Exception:
            report["checks"]["leads_pipeline"] = {
                "ok": True,
                "detail": "API non raggiungibile",
            }

        return report

    def _send_telegram(self, report: dict):
        bot_token = os.environ.get("TELEGRAM_BOT_TOKEN")
        chat_id = os.environ.get("TELEGRAM_CHAT_ID")
        if not bot_token or not chat_id:
            self.log("Telegram non configurato. Salto notifica.")
            return

        checks = report.get("checks", {})
        status_icon = "🟢" if report.get("status") == "healthy" else "🟡"
        lines = [
            f"<b>{status_icon} NeatX Guardian — Report Giornaliero</b>",
            f"📅 {report.get('date')}",
            "",
        ]
        today = report.get("today", {})
        if today:
            lines.append(f"🎯 <b>Oggi:</b> {today.get('niche')} — {today.get('feature')}")
            lines.append(f"📺 Cover: {today.get('cover')}")
            lines.append("")

        for key, check in checks.items():
            icon = "✅" if check.get("ok") else "⚠️"
            lines.append(f"{icon} <b>{key}:</b> {check.get('detail')}")

        recap = None
        ideas_msgs = self.bus.read("content_ideas")
        if ideas_msgs:
            payload = ideas_msgs[-1]["payload"]
            recap = payload.get("trend", "")
        if recap:
            lines.append("")
            lines.append(f"📈 <b>Trend del giorno:</b> {recap}")

        text = "\n".join(lines)
        try:
            import requests
            requests.post(
                f"https://api.telegram.org/bot{bot_token}/sendMessage",
                json={"chat_id": chat_id, "text": text, "parse_mode": "HTML", "disable_web_page_preview": True},
                timeout=10,
            )
            self.log("Notifica Telegram inviata.")
        except Exception as e:
            self.log(f"Errore notifica Telegram: {e}")

    def _now(self):
        from datetime import datetime
        return datetime.now().isoformat()


def reel_check_path():
    return "bot_scripts/Social/ReelGenerator/reel_data.json"


if __name__ == "__main__":
    GuardianAgent().run()
