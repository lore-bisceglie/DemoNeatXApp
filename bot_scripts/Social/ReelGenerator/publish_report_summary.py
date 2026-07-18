import json, os, sys

path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), 'publish_report.json')
if not os.path.exists(path):
    print("Non ho generato nessun video in questo turno. (Nessun report trovato)")
    sys.exit(0)

with open(path) as f:
    r = json.load(f)

print("Ciao Lore! Il pilota automatico ha appena finito il suo turno di lavoro. 🚀\n")
print("Ecco dove ho pubblicato il nuovo video di oggi:\n")

nomi_social = {
    "instagram": "📱 Instagram",
    "tiktok": "🎵 TikTok",
    "youtube": "▶️ YouTube"
}

for k, v in r.get('results', {}).items():
    ok = v.get('ok')
    social = nomi_social.get(k, k.capitalize())
    
    if ok:
        print(f"✅ {social}: Video online!")
    else:
        # Se c'è un errore, rendiamolo comprensibile e non troppo spaventoso
        msg = v.get("message", "")
        motivo = ""
        if k == "tiktok" and ("make.com" in msg.lower() or "webhook" in msg.lower()):
            motivo = f" (Problema con Make.com: {msg})"
        elif k == "youtube" and "token" in msg.lower():
            motivo = " (Token scaduto o mancante)"
        else:
            motivo = f" ({msg})"
            
        print(f"❌ {social}: Saltato {motivo}")

print("\nContinua a monitorare i direct per i nuovi clienti!")
