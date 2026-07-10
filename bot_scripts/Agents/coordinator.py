#!/usr/bin/env python3
"""
NeatX Agent Coordinator.
Esegue gli agenti in sequenza: MarketIntelligence -> ContentAdvisor -> Guardian.
Ogni agente scrive su un message bus (blackboard JSON) che gli altri agenti leggono.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from market_intelligence import MarketIntelligenceAgent
from content_advisor import ContentAdvisorAgent
from guardian import GuardianAgent
from content_machine import ContentMachineAgent


def main():
    print("=" * 50)
    print("  NeatX Agent Coordinator")
    print("=" * 50)

    agents = [
        ("Market Intelligence", MarketIntelligenceAgent()),
        ("Content Machine", ContentMachineAgent()),
        ("Content Advisor", ContentAdvisorAgent()),
        ("Guardian", GuardianAgent()),
    ]

    for name, agent in agents:
        print(f"\n--- Avvio {name} ---")
        try:
            agent.run()
            print(f"--- {name} completato ---")
        except Exception as e:
            print(f"[!] {name} fallito: {e}")
            import traceback
            traceback.print_exc()

    print("\n" + "=" * 50)
    print("  Ciclo agenti completato.")
    print("=" * 50)


if __name__ == "__main__":
    main()
