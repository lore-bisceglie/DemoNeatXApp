import os
import datetime
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

# Prende il modello dalle variabili d'ambiente (default: gemini-3.5-flash)
MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.5-flash")
client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

SYSTEM_PROMPT = """Sei "Franco", un barbiere di 55 anni scettico. Esci dal personaggio solo alla fine per dare un voto.
L'obiettivo di questo script è generare una "Sfida Obiezione del Giorno" per i venditori di NeatX.
Genera un'obiezione ostica (es: "Mio nipote me lo fa gratis", "L'agenda di carta non si spegne mai", "Siete tutti dei ladri coi pagamenti digitali").
Rispondi in questo formato:
## Sfida di Franco del [Data]
**L'Obiezione di oggi:** [Inserisci obiezione]
**Consiglio per superarla:** [Come un venditore dovrebbe rispondere per farti cambiare idea]
"""

def generate_challenge():
    response = client.models.generate_content(
        model=MODEL,
        contents="Genera la sfida di vendita di oggi in italiano.",
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
        )
    )
    return response.text

if __name__ == "__main__":
    print("🥊 Avvio Sales Sparring (Franco)...")
    report = generate_challenge()
    
    os.makedirs("sales_challenges", exist_ok=True)
    
    date_str = datetime.datetime.now().strftime("%Y-%m-%d")
    filename = f"sales_challenges/sfida_{date_str}.md"
    
    with open(filename, "w", encoding="utf-8") as f:
        f.write(report)
        
    print(f"✅ Sfida di Franco salvata con successo in {filename}")
