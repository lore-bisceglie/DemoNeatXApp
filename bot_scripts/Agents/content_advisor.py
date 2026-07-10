import json
import random
from pathlib import Path

from agent_base import BaseAgent

REPO_ROOT = Path(__file__).resolve().parents[2]
CONTENT_STRATEGY_DIR = REPO_ROOT / "content_strategy"

class ContentAdvisorAgent(BaseAgent):
    name = "ContentAdvisor"

    def run(self):
        self.log("Analisi intelligence in corso...")

        # 1. Legge le idee dal bus
        ideas_msgs = self.bus.read("content_ideas")
        intelligence_msgs = self.bus.read("intelligence")

        latest_ideas = []
        if ideas_msgs:
            last = ideas_msgs[-1]["payload"]
            latest_ideas = last.get("ideas", [])

        trend = ""
        if intelligence_msgs:
            trend = intelligence_msgs[-1]["payload"].get("trend", "")

        self.log(f"Trovate {len(latest_ideas)} idee fresche. Trend: {trend}")

        # 2. Migliora il calendario esistente se presente
        improved = self._improve_calendar(latest_ideas, trend)
        if improved:
            self.log("Calendario aggiornato con le nuove idee.")
        else:
            self.log("Nessun calendario da aggiornare, genero suggerimenti.")

        # 3. Suggerisce ottimizzazioni per i bot esistenti
        suggestions = self._suggest_optimizations(latest_ideas, trend)
        self.post("content_suggestions", {
            "type": "strategy_update",
            "suggestions": suggestions,
            "target_segment": random.choice(["Parrucchieri", "Barbieri", "Centri Estetici", "Fisioterapisti"]),
        })

        self.log(f"Generate {len(suggestions)} raccomandazioni.")

    def _improve_calendar(self, ideas: list[dict], trend: str) -> bool:
        cal_path = CONTENT_STRATEGY_DIR / "content_calendar.json"
        if not cal_path.exists():
            return False

        try:
            cal = json.loads(cal_path.read_text(encoding="utf-8"))
        except Exception:
            return False

        days = cal.get("days", [])
        if not days:
            return False

        # Arricchisce il calendario con le idee dell'agente
        for i, idea in enumerate(ideas[:3]):
            if i < len(days):
                days[i]["agent_hook"] = idea.get("hook", "")
                days[i]["agent_trend"] = trend

        cal["days"] = days
        cal["agent_enhanced_at"] = self._now()
        cal_path.write_text(json.dumps(cal, ensure_ascii=False, indent=2), encoding="utf-8")

        # Aggiorna anche il today_brief se il giorno corrente è tra quelli arricchiti
        brief_path = CONTENT_STRATEGY_DIR / "today_brief.json"
        if brief_path.exists():
            try:
                brief = json.loads(brief_path.read_text(encoding="utf-8"))
                today = self._now()[:10]
                for day in days:
                    if day.get("date", "")[:10] == today and day.get("agent_hook"):
                        brief["agent_hook"] = day["agent_hook"]
                        brief_path.write_text(json.dumps(brief, ensure_ascii=False, indent=2), encoding="utf-8")
                        break
            except Exception:
                pass

        return True

    def _now(self):
        from datetime import datetime
        return datetime.now().isoformat()

    def _suggest_optimizations(self, ideas: list[dict], trend: str) -> list[dict]:
        suggestions = []

        if ideas:
            for idea in ideas[:2]:
                suggestions.append({
                    "type": "reel",
                    "action": f"Crea un reel su {idea['niche']}: {idea['hook']}",
                    "priority": "alta",
                })

        if trend:
            suggestions.append({
                "type": "blog",
                "action": f"Articolo blog: '{trend} — come NeatX risolve il problema'",
                "priority": "media",
            })

        suggestions.append({
            "type": "general",
            "action": "Aggiornare i prompt AI del reel bot per enfatizzare il confronto con competitor",
            "priority": "bassa",
        })

        return suggestions


if __name__ == "__main__":
    ContentAdvisorAgent().run()
