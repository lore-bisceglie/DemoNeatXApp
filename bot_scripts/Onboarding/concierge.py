import os
import datetime
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

SYSTEM_PROMPT = """Sei "NeatX Onboarding Concierge", il responsabile dell'esperienza clienti di NeatX.
Il tuo compito è scrivere la bozza di un'email di benvenuto personalizzata per i nuovi iscritti di oggi.
Usa un tono entusiasta, amichevole e rassicurante. Includi 3 step pratici per usare NeatX in base alla loro professione."""

MOCK_NEW_USERS = [
    {"nome": "Luca", "professione": "Tatuatore", "salone": "Ink Master Studio"},
    {"nome": "Sara", "professione": "Estetista", "salone": "Nails & Beauty"}
]

def generate_onboarding_emails():
    report = ""
    for user in MOCK_NEW_USERS:
        prompt = f"Genera un'email di benvenuto per {user['nome']}, un {user['professione']} titolare di {user['salone']}."
        try:
            response = client.models.generate_content(model="gemini-3.5-flash", contents=prompt, config=types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT))
            report += f"## Email per {user['nome']} ({user['salone']})\\n"
            report += response.text + "\\n\\n---\\n\\n"
        except Exception as e:
            print(f"❌ Errore durante la generazione dell'email per {user['nome']}: {e}")
            report += f"## Email per {user['nome']} ({user['salone']})\\n[Errore di generazione AI. Riprovare più tardi.]\\n\\n---\\n\\n"
    return report

if __name__ == "__main__":
    print("🚀 Avvio Onboarding Concierge...")
    report = generate_onboarding_emails()
    
    os.makedirs("onboarding_drafts", exist_ok=True)
    
    date_str = datetime.datetime.now().strftime("%Y-%m-%d")
    filename = f"onboarding_drafts/email_benvenuto_{date_str}.md"
    
    with open(filename, "w", encoding="utf-8") as f:
        f.write(f"# Bozze Email di Benvenuto - {date_str}\\n\\n")
        f.write(report)
        
    print(f"✅ Email di benvenuto salvate con successo in {filename}")
