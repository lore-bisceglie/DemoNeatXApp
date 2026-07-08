import os
import datetime
import google.generativeai as genai

# Setup API Key
genai.configure(api_key=os.environ["GEMINI_API_KEY"])

SYSTEM_PROMPT = """Sei "NeatX Competitor Spy", un esperto stratega di marketing a risposta diretta e analista competitivo per NeatX.
Il tuo obiettivo è analizzare le recensioni negative dei nostri competitor (Treatwell, Booksy, Fresha) e trasformarle in munizioni per le nostre campagne marketing.
1. Identifica l'emozione principale.
2. Genera 3 Hook per Facebook Ads.
3. Scrivi 1 bozza di Email a freddo.
Rispondi sempre in formato Markdown."""

# MOCK DATA (Simulazione recensioni recenti trovate online)
RECENT_REVIEWS = [
    "Uso Treatwell da due anni, le commissioni al 35% sui nuovi clienti mi stanno uccidendo. Lavoro gratis per loro.",
    "L'assistenza di Booksy è inesistente. Ieri l'app è andata in crash, ho perso 5 appuntamenti e nessuno mi ha risposto al telefono."
]

def analyze_reviews():
    model = genai.GenerativeModel('gemini-1.5-flash-latest', system_instruction=SYSTEM_PROMPT)
    prompt = f"Analizza queste recenti recensioni negative trovate online oggi:\\n\\n"
    for r in RECENT_REVIEWS:
        prompt += f"- \\\"{r}\\\"\\n"
        
    response = model.generate_content(prompt)
    return response.text

if __name__ == "__main__":
    print("🕵️ Avvio Competitor Spy Bot...")
    report = analyze_reviews()
    
    # Crea la cartella se non esiste
    os.makedirs("competitor_reports", exist_ok=True)
    
    # Salva il report
    date_str = datetime.datetime.now().strftime("%Y-%m-%d")
    filename = f"competitor_reports/report_{date_str}.md"
    
    with open(filename, "w", encoding="utf-8") as f:
        f.write(f"# Report Competitor Spy - {date_str}\\n\\n")
        f.write(report)
        
    print(f"✅ Report salvato con successo in {filename}")
