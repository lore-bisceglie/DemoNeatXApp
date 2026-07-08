import os
import datetime
import google.generativeai as genai

genai.configure(api_key=os.environ["GEMINI_API_KEY"])

SYSTEM_PROMPT = """Sei "Franco", un barbiere di 55 anni scettico. Esci dal personaggio solo alla fine per dare un voto.
L'obiettivo di questo script è generare una "Sfida Obiezione del Giorno" per i venditori di NeatX.
Genera un'obiezione ostica (es: "Mio nipote me lo fa gratis", "L'agenda di carta non si spegne mai", "Siete tutti dei ladri coi pagamenti digitali").
Rispondi in questo formato:
## Sfida di Franco del [Data]
**L'Obiezione di oggi:** [Inserisci obiezione]
**Consiglio per superarla:** [Come un venditore dovrebbe rispondere per farti cambiare idea]
"""

def generate_challenge():
    model = genai.GenerativeModel('gemini-1.5-flash', system_instruction=SYSTEM_PROMPT)
    response = model.generate_content("Genera la sfida di vendita di oggi in italiano.")
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
