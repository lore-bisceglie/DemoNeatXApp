import json
import os
import random
from pathlib import Path
from datetime import datetime, timedelta

from agent_base import BaseAgent

REPO_ROOT = Path(__file__).resolve().parents[2]
CONTENT_STRATEGY_DIR = REPO_ROOT / "content_strategy"
REEL_DIR = REPO_ROOT / "bot_scripts" / "Social" / "ReelGenerator"
BLOG_DIR = REPO_ROOT / "bot_scripts" / "SEO_Machine"
OUT_DIR = REPO_ROOT / "content_strategy"

CHANNELS = ["newsletter", "social"]  # Canali NON coperti da altri bot

WEEKLY_PLAN = {
    0: "reel",        # lunedi -> gia coperto da reel bot
    1: "newsletter",  # martedi -> NUOVO
    2: "reel",        # mercoledi -> gia coperto da reel bot
    3: "newsletter",  # giovedi -> NUOVO
    4: "reel",        # venerdi -> gia coperto da reel bot
    5: "social",      # sabato -> NUOVO
    6: "rest",        # domenica
}

class ContentMachineAgent(BaseAgent):
    name = "ContentMachine"

    def run(self):
        self.log("Pianificazione contenuti multi-canale in corso...")

        # 1. Legge trend da MarketIntelligence
        trends = self.bus.read("content_ideas")
        latest_trend = None
        if trends:
            latest_trend = trends[-1]["payload"]

        # 2. Legge calendario esistente
        calendar = self._load_calendar()

        # 3. Legge storico performance
        history = self._load_history()

        # 4. Determina il canale del giorno
        today = datetime.now()
        channel = WEEKLY_PLAN.get(today.weekday(), "rest")
        self.log(f"Oggi: {today.strftime('%A')} -> canale: {channel}")

        if channel == "rest":
            self.log("Domenica: riposo. Pianificazione settimana prossima.")
            self.post("content_plan", {
                "type": "weekly_plan",
                "channel": "rest",
                "message": "Niente contenuti oggi. Buon riposo!",
            })
            return

        # 5. Recupera o genera idea per oggi
        idea = self._get_todays_idea(calendar, latest_trend, history)
        if not idea:
            self.log("Nessuna idea disponibile. Salto.")
            return

        self.log(f"Idea del giorno: {idea['niche']} -> {idea['cover_title']}")

        # 6. Genera contenuti per il canale del giorno
        content = self._generate_content(idea, channel, history)
        if content:
            self._save_content(content, channel)
            self.post("content_plan", {
                "type": "content_generated",
                "channel": channel,
                "niche": idea["niche"],
                "title": idea["cover_title"],
                "feature": idea.get("feature_label", ""),
                "generated_at": self._now(),
            })
            self.log(f"Contenuto {channel} generato e salvato.")

        # 7. Pianifica anche i prossimi giorni (se non gia pianificati)
        self._plan_week(idea, calendar, history)

        self.log("Missione completata.")

    def _load_calendar(self) -> dict:
        cal_path = CONTENT_STRATEGY_DIR / "content_calendar.json"
        if cal_path.exists():
            try:
                return json.loads(cal_path.read_text(encoding="utf-8"))
            except Exception:
                return {"days": []}
        return {"days": []}

    def _load_history(self) -> list:
        hist_path = REPO_ROOT / "bot_scripts/Social/ReelGenerator/history.json"
        if hist_path.exists():
            try:
                return json.loads(hist_path.read_text(encoding="utf-8"))
            except Exception:
                return []
        return []

    def _get_todays_idea(self, calendar: dict, trend: dict | None, history: list) -> dict | None:
        today = datetime.now().strftime("%Y-%m-%d")

        # Cerca nel calendario esistente
        for day in calendar.get("days", []):
            if day.get("date", "")[:10] == today:
                return day

        # Se trend ha idee, usa la prima
        if trend and trend.get("ideas"):
            idea = trend["ideas"][0]
            niches = ["Parrucchieri", "Barbieri", "Centri Estetici", "Fisioterapisti", "Tatuatori", "Personal Trainer"]
            return {
                "niche": idea.get("niche") or random.choice(niches),
                "cover_title": idea.get("hook", "BASTA NO-SHOW")[:30],
                "angle": trend.get("trend", ""),
                "pain": f"perdere tempo con sistemi manuali",
                "promise": "automatizzare tutto con NeatX",
                "feature_label": "",
                "image_prompt": f"photorealistic {random.choice(niches).lower()} professional working",
                "gameplay_style": random.choice(["runner", "block_miner", "neon_racer"]),
            }

        # Fallback: usa la storia migliore come ispirazione
        if history:
            best = sorted(history, key=lambda x: x.get("views", 0), reverse=True)
            top = best[0] if best else None
            if top:
                hook = top.get("hook", top.get("title", "BASTA NO-SHOW"))
                return {
                    "niche": top.get("niche", "Barbieri"),
                    "cover_title": hook[:30],
                    "angle": "tema con performance storica",
                    "pain": "perdere tempo con sistemi manuali",
                    "promise": "automatizzare tutto con NeatX",
                    "feature_label": "",
                    "image_prompt": f"photorealistic professional working",
                    "gameplay_style": "runner",
                }

        return None

    def _generate_content(self, idea: dict, channel: str, history: list) -> dict | None:
        """Genera contenuto specifico per il canale del giorno (solo canali non coperti da altri bot)."""
        niche = idea.get("niche", "Barbieri")
        title = idea.get("cover_title", "BASTA NO-SHOW")
        pain = idea.get("pain", "perdere tempo")
        promise = idea.get("promise", "automatizzare")

        if channel == "newsletter":
            return {
                "subject": f"{title} — La soluzione per {niche}",
                "preview": f"Scopri come {promise} senza stress",
                "body": f"Ciao,\n\nSe sei tra i {niche.lower()} e ancora {pain}, c'e una soluzione.\n\n<b>{title}</b>\n\nCon NeatX puoi {promise} in automatico, senza alzare un dito.\n\nPrenotazioni 24/7, promemoria, timesheet, recensioni — tutto incluso.\n\n<a href='https://neatx.store/registrazione'>Prova gratis 7 giorni</a>",
            }

        elif channel == "social":
            return {
                "platform": "facebook",
                "text": f"{title} 👈\n\nSe sei tra i {niche.lower()} e ancora {pain}, oggi c'e una soluzione.\n\nNeatX: {promise}.\n\n👉 https://neatx.store/registrazione",
                "hashtags": "#perte #fyp #foryou #viral #imprenditore #businessitalia #crescita #neatx",
            }

        return None

    def _save_content(self, content: dict, channel: str):
        """Salva il contenuto generato per il canale specifico."""
        out = OUT_DIR / "generated"
        out.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M")
        filepath = out / f"{channel}_{timestamp}.json"
        filepath.write_text(json.dumps(content, ensure_ascii=False, indent=2), encoding="utf-8")
        self.log(f"Salvato: {filepath.name}")

    def _plan_week(self, idea: dict, calendar: dict, history: list):
        """Pianifica i prossimi giorni se il calendario e vuoto."""
        cal_path = CONTENT_STRATEGY_DIR / "content_calendar.json"
        days = calendar.get("days", [])

        today = datetime.now()
        needs_planning = False
        for i in range(1, 7):
            check_date = (today + timedelta(days=i)).strftime("%Y-%m-%d")
            found = any(d.get("date", "")[:10] == check_date for d in days)
            if not found:
                needs_planning = True
                break

        if not needs_planning:
            return

        self.log("Calendario da integrare. Pianifico i prossimi giorni...")

        niches = ["Parrucchieri", "Barbieri", "Centri Estetici", "Fisioterapisti", "Tatuatori", "Personal Trainer"]
        features = [
            {"id": "no_show", "label": "Zero No-Show"},
            {"id": "booking", "label": "Prenotazione 24/7"},
            {"id": "timesheet", "label": "Timesheet Commercialista"},
            {"id": "recensioni", "label": "Recensioni Automatiche"},
            {"id": "promemoria", "label": "Promemoria WhatsApp"},
            {"id": "analytics", "label": "Statistiche e Dati"},
            {"id": "multi_staff", "label": "Gestione Staff"},
        ]

        new_days = list(days)
        random.shuffle(niches)
        random.shuffle(features)

        for i in range(7):
            check_date = (today + timedelta(days=i)).strftime("%Y-%m-%d")
            found = any(d.get("date", "")[:10] == check_date for d in new_days)
            if not found:
                niche = niches[i % len(niches)]
                feature = features[i % len(features)]
                cover_formats = {
                    "no_show": "BASTA NO-SHOW",
                    "booking": "PRENOTA 24/7",
                    "timesheet": "TIMESHEET AUTO",
                    "recensioni": "RECENSIONI AUTO",
                    "promemoria": "PROMEMORIA AUTO",
                    "analytics": "DATI IN TEMPO REALE",
                    "multi_staff": "GESTIONE TEAM",
                }
                new_days.append({
                    "date": check_date,
                    "niche": niche,
                    "feature": feature["id"],
                    "feature_label": feature["label"],
                    "cover_title": cover_formats.get(feature["id"], "BASTA NO-SHOW"),
                    "pain": f"perdere tempo con {niche.lower()}",
                    "promise": f"automatizzare con NeatX",
                    "platform": WEEKLY_PLAN.get((today + timedelta(days=i)).weekday(), "reel"),
                    "image_prompt": f"photorealistic {niche.lower()} working",
                    "gameplay_style": random.choice(["runner", "block_miner", "neon_racer"]),
                })

        calendar["days"] = new_days
        cal_path.write_text(json.dumps(calendar, ensure_ascii=False, indent=2), encoding="utf-8")
        self.log(f"Calendario aggiornato: {len(new_days)} giorni.")

    def _now(self):
        return datetime.now().isoformat()


if __name__ == "__main__":
    ContentMachineAgent().run()
