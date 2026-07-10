import os
import json
import random
from pathlib import Path

from agent_base import BaseAgent

REPO_ROOT = Path(__file__).resolve().parents[2]

COMPETITORS = [
    {"name": "Booksy", "weakness": "commissioni 20-30%, abbonamento alto, interfaccia complessa"},
    {"name": "Treatwell", "weakness": "35% commissioni, ruba clienti, difficile personalizzare"},
    {"name": "Uala", "weakness": "vincoli rigidi, software pesante, manca automazione social"},
]

TREND_TOPICS = [
    "clienti che pretendono prenotazioni 24/7 via Instagram",
    "acconto obbligatorio sta diventando standard nel beauty",
    "recensioni Google come secondo biglietto da visita",
    "intelligenza artificiale nelle piccole imprese italiane",
    "timesheet digitali per la riforma fiscale 2025",
    "automazione WhatsApp sta sostituendo le telefonate",
]

class MarketIntelligenceAgent(BaseAgent):
    name = "MarketIntelligence"

    def run(self):
        self.log("Scansione competitor e trend in corso...")

        # 1. Trends casuali del giorno (in futuro leggerà da API reali)
        trend = random.choice(TREND_TOPICS)
        self.log(f"Trend individuato: {trend}")

        # 2. Sceglie un competitor e una debolezza
        comp = random.choice(COMPETITORS)
        self.log(f"Competitor osservato: {comp['name']}")

        # 3. Genera idee per contenuti
        ideas = self._generate_ideas(trend, comp)
        self.log(f"Generate {len(ideas)} idee contenuto")

        # Posta le idee sul bus
        self.post("content_ideas", {
            "type": "new_ideas",
            "ideas": ideas,
            "trend": trend,
            "competitor_focus": comp,
            "generated_at": self._now(),
        })

        # Posta intelligence report
        self.post("intelligence", {
            "type": "daily_brief",
            "trend": trend,
            "competitor": comp,
            "recommendation": self._recommendation(trend, comp),
        })

        self.log("Missione completata.")

    def _now(self):
        from datetime import datetime
        return datetime.now().isoformat()

    def _generate_ideas(self, trend: str, competitor: dict) -> list[dict]:
        niches = ["Parrucchieri", "Barbieri", "Centri Estetici", "Fisioterapisti", "Tatuatori", "Personal Trainer"]
        selected = random.sample(niches, min(3, len(niches)))
        return [
            {
                "niche": niche,
                "hook": f"{niche}: {competitor['name']} ti sta facendo perdere soldi?",
                "angle": trend,
                "cta": "Commenta AGENDA",
            }
            for niche in selected
        ]

    def _recommendation(self, trend: str, competitor: dict) -> str:
        return f"Approfitta del trend '{trend}' per creare contenuti che confrontano NeatX con {competitor['name']} ({competitor['weakness']})."


if __name__ == "__main__":
    MarketIntelligenceAgent().run()
