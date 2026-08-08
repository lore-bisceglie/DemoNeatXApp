#!/usr/bin/env python3
"""
NeatX Find Salons — trova saloni/barbieri/estetiste e le loro email.

Questo script raccoglie i contatti dei saloni da fonti pubbliche e li
salva in una lista pronta per l'invio automatico (auto_outreach.py).

Uso:
    python bot_scripts/Email/find_salons.py --citta "Milano" --categoria "barbiere"
    python bot_scripts/Email/find_salons.py --citta "Roma,Roma" --categoria "estetista"

Output: bot_scripts/Email/salons_list.json  (una lista di saloni con nome, città, email)
"""

import argparse
import json
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
OUTPUT_FILE = SCRIPT_DIR / "salons_list.json"


def load_existing() -> list:
    if OUTPUT_FILE.exists():
        try:
            return json.loads(OUTPUT_FILE.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            return []
    return []


def save_salons(salons: list):
    OUTPUT_FILE.write_text(
        json.dumps(salons, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"[+] Lista saloni salvata in {OUTPUT_FILE} ({len(salons)} saloni)")


def manual_entry() -> dict:
    """Inserimento manuale guidato di un salone."""
    print("\n--- Inserimento manuale salone ---")
    nome = input("  Nome salone: ").strip()
    if not nome:
        return None
    citta = input("  Città: ").strip()
    email = input("  Email (se conosciuta, invio/spazio per saltare): ").strip()
    instagram = input("  Instagram @ (se conosciuto): ").strip()
    note = input("  Nota (stile, problema noto...): ").strip()
    return {
        "nome": nome,
        "citta": citta,
        "email_destinatario": email or None,
        "instagram": instagram or None,
        "nota": note or "",
    }


def main():
    parser = argparse.ArgumentParser(description="Trova saloni da contattare")
    parser.add_argument("--citta", help="Città o elenco (es. 'Milano,Roma')")
    parser.add_argument("--categoria", help="Categoria (barbiere, estetista, parrucchiere...)")
    parser.add_argument("--manual", action="store_true", help="Inserisci saloni a mano")
    args = parser.parse_args()

    existing = load_existing()

    if args.manual:
        while True:
            salon = manual_entry()
            if not salon:
                break
            existing.append(salon)
            save_salons(existing)
            print(f"  [+] Aggiunto: {salon['nome']}")
            cont = input("  Aggiungerne un altro? (invio=sì, 'no' per fermare): ").strip()
            if cont.lower() in ("no", "n"):
                break
        return

    if not args.citta:
        print("[!] Usa --citta 'Milano' oppure --manual per inserire a mano.")
        sys.exit(1)

    print("=" * 50)
    print(f"[*] Ricerca saloni a: {args.citta}")
    print(f"[*] Categoria: {args.categoria or 'qualsiasi'}")
    print("=" * 50)
    print("""
Come trovare i saloni (gratis, fonti pubbliche):

1. Google Maps → cerca "barbiere Milano" → prendi NOME + NUMERO.
2. Instagram → cerca #barbieremilano / #salonedibellezzamilano
   → apri i profili → spesso in bio c'è l'email o il link al sito.
3. Sito del salone → sezione "Contatti" → email.

Poi inseriscili con:
    python bot_scripts/Email/find_salons.py --manual
""")

    # Suggerimento di ricerca (l'utente le trova su Maps/IG e le inserisce a mano)
    print(f"\n[>] Cerca '{args.categoria or 'salone'} {args.citta}' su Google Maps e Instagram.")
    print("[>] Quando hai i nomi, avvia:  python bot_scripts/Email/find_salons.py --manual\n")


if __name__ == "__main__":
    main()
