import os
import time
import csv
import json
import re
from playwright.sync_api import sync_playwright
import google.generativeai as genai

# ==========================================
# CONFIGURAZIONE
# ==========================================
def setup_gemini():
    # Per semplicità cerchiamo di leggere la chiave dal vecchio bot
    try:
        with open("../ReelGenerator/auto_bot.py", "r", encoding="utf-8") as f:
            content = f.read()
            match = re.search(r'GEMINI_API_KEY\s*=\s*"([^"]+)"', content)
            if match:
                genai.configure(api_key=match.group(1))
                return True
    except Exception as e:
        print(f"[!] Impossibile leggere API Key: {e}")
    return False

def genera_messaggio_vendita(nome_salone, settore):
    """
    Usa Gemini per scrivere un messaggio a freddo irresistibile
    """
    model = genai.GenerativeModel('gemini-pro', generation_config={"response_mime_type": "text/plain"})
    
    prompt = f"""
Sei un venditore esperto e spietato, ma molto amichevole e naturale.
Devi scrivere un singolo messaggio WhatsApp a freddo da inviare a questo potenziale cliente.
Nome del potenziale cliente (azienda): "{nome_salone}"
Settore: "{settore}"

Stai proponendo 'NeatX', un'app che automatizza le prenotazioni e fa risparmiare un sacco di tempo e soldi.
Regole del messaggio:
- NON usare formule formali. Inizia in modo super naturale: "Ciao {nome_salone}! Ho visto la vostra pagina..."
- Deve essere BREVISSIMO (max 4-5 righe).
- Tocca il punto di dolore: "gestire gli appuntamenti su WhatsApp fa perdere un sacco di tempo".
- Chiudi con una domanda (Call to Action): "Posso mandarvi un breve video di come funziona?"
"""
    try:
        response = model.generate_content(prompt)
        return response.text.strip().replace("\n\n", "\n")
    except Exception as e:
        return f"[Errore Gemini: {e}]"

def caccia_su_maps(query, limite=5):
    print(f"\n[*] INIZIO CACCIA SU GOOGLE MAPS PER: '{query}'")
    risultati = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        try:
            # Creiamo direttamente l'URL di ricerca per evitare problemi con l'input box
            url_query = query.replace(' ', '+')
            page.goto(f"https://www.google.com/maps/search/{url_query}", timeout=60000)
            time.sleep(4)
            
            # Accetta i cookie se compare il popup
            try:
                page.locator("button:has-text('Accetta tutto')").click(timeout=5000)
                time.sleep(2)
            except:
                pass
            
            print("[*] Ricerca in corso. Attendo il caricamento dei risultati...")
            time.sleep(5)
            
            for _ in range(4):
                page.mouse.wheel(0, 1500)
                time.sleep(2)
                
            # Google Maps cambia spesso i selettori. Proviamo i più comuni per le schede business.
            links = page.locator("a.hfpxzc").all()
            if not links:
                links = page.locator("a[href*='/place/']").all()
            if not links:
                links = page.locator("div[role='feed'] a[aria-label]").all()
                
            print(f"[+] Trovati {len(links)} potenziali risultati.")
            
            links = links[:limite]
            
            for idx, link_element in enumerate(links):
                try:
                    nome_salone = link_element.get_attribute("aria-label")
                    if not nome_salone:
                        continue
                        
                    print(f"\n[{idx+1}/{limite}] Analizzo: {nome_salone}")
                    
                    link_element.click(force=True)
                    time.sleep(3) 
                    
                    panel_text = page.locator("div[role='main']").inner_text()
                    
                    telefono = "Non Trovato"
                    phone_match = re.search(r'(\+39\s?)?((3\d{2}\s?\d{6,7})|(0\d{1,3}\s?\d{5,8}))', panel_text)
                    if phone_match:
                        telefono = phone_match.group(0).strip()
                        
                    print(f"    - Telefono: {telefono}")
                    
                    messaggio_ai = genera_messaggio_vendita(nome_salone, query)
                    
                    risultati.append({
                        "Nome": nome_salone,
                        "Telefono": telefono,
                        "Messaggio_AI": messaggio_ai
                    })
                    
                except Exception as e:
                    print(f"    [!] Errore durante l'analisi: {e}")
                    
        except Exception as e:
            print(f"[!] Errore in Playwright: {e}")
        finally:
            browser.close()
            
    return risultati

def salva_in_csv(risultati, nome_file="leads_estratti.csv"):
    if not risultati:
        print("\n[!] Nessun risultato da salvare.")
        return
        
    keys = risultati[0].keys()
    with open(nome_file, 'w', newline='', encoding='utf-8') as output_file:
        dict_writer = csv.DictWriter(output_file, keys)
        dict_writer.writeheader()
        dict_writer.writerows(risultati)
    print(f"\n[+] Salvati {len(risultati)} contatti pronti all'uso in '{nome_file}'.")

if __name__ == "__main__":
    if setup_gemini():
        target = input("\n[?] Inserisci il tipo di attività e la città (es. 'Barbieri a Roma'): ")
        if target.strip():
            leads = caccia_su_maps(target.strip(), limite=5)
            salva_in_csv(leads)
    else:
        print("[!] Impossibile configurare Gemini. Controlla la chiave API.")
