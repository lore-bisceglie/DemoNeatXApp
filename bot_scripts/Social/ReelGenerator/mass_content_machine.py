import os
import json
import glob
import urllib.parse
import requests
import subprocess
import time
from datetime import datetime

# ==========================================
# FABBRICA DEI REEL - CONFIGURAZIONE
# ==========================================

# Lista delle professioni (per il test ne usiamo 2, ma potrai metterne 100)
PROFESSIONI = [
    "Meccanico"
]

OUTPUT_DIR = "Reels_Finiti"
REEL_DATA_FILE = "reel_data.json"
CACHE_IMAGE = "assets/niche_bg.jpg"
GENERATED_VIDEO = "reel_splitscreen_subbed.mp4"

def genera_testo_virale(professione):
    """Chiama l'AI testuale per scrivere lo script su misura"""
    prompt = f"Scrivi un breve monologo virale e persuasivo per TikTok (circa 50-60 parole in italiano). Il target sono i {professione}. Il problema è che perdono tempo a gestire gli appuntamenti a mano al telefono. La soluzione è un'app di prenotazioni automatica H24. Scrivi solo il monologo, senza intestazioni, senza emoji, stile diretto e aggressivo (stile Alex Hormozi). Nella prima frase devi catturare l'attenzione menzionando il nome del lavoro. Fai tutto su un unico paragrafo."
    
    safe_prompt = urllib.parse.quote(prompt)
    url = f"https://text.pollinations.ai/prompt/{safe_prompt}"
    
    print(f"[*] Chiedo all'AI di scrivere un monologo perfetto per: {professione}...")
    try:
        response = requests.get(url)
        response.raise_for_status()
        testo = response.text.strip()
        # Rimuove le virgolette in eccesso se l'AI le ha messe
        if testo.startswith('"') and testo.endswith('"'):
            testo = testo[1:-1]
        print(f"[+] Testo generato: {testo[:60]}...")
        return testo
    except Exception as e:
        print(f"[!] Errore generazione testo: {e}")
        return f"{professione}, butti via soldi! Sei stanco di perdere tempo al telefono per gestire gli appuntamenti? Mentre tu rispondi ai messaggi, i tuoi concorrenti lavorano e incassano. Ogni minuto perso sull'agenda è un minuto che non vieni pagato. Devi automatizzare! Installa un'app che prenda le prenotazioni per te 24 ore su 24, zero sforzo e agenda sempre piena. Commenta AGENDA qui sotto e ti mostro come fare in automatico!"

def crea_fabbrica():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    for professione in PROFESSIONI:
        print(f"\n==============================================")
        print(f"[*] AVVIO PRODUZIONE PER: {professione.upper()}")
        print(f"==============================================")
        
        # 1. Genera Script e Dati
        script_testo = genera_testo_virale(professione)
        hook = f"{professione.upper()}: BUTTI SOLDI?"
        
        dati = {
            "niche": professione,
            "script_text": script_testo,
            "hook_text": hook,
            "cover_title": hook,
            "pexels_query": professione,
            "caption": f"Sei un {professione} e perdi la testa dietro le prenotazioni? Commenta AGENDA qui sotto 👇"
        }
        
        # Scrive il JSON
        with open(REEL_DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(dati, f, indent=4, ensure_ascii=False)
            
        # 2. Pulisce la cache dell'immagine per forzare una nuova AI Image
        for f in glob.glob("assets/niche_img_*.jpg"):
            try:
                os.remove(f)
            except OSError:
                pass
        print("[*] Cache immagini precedenti pulita.")
            
        # Pulisce vecchi video generati
        if os.path.exists(GENERATED_VIDEO):
            try:
                os.remove(GENERATED_VIDEO)
            except:
                pass
            
        # 3. Lancia lo script madre
        print(f"[*] Accensione dei motori (generate_reel.py)...")
        start_time = time.time()
        
        try:
            # Esecuzione bloccante (subprocess)
            subprocess.run(["python", "generate_reel.py"], check=True)
            
            # 4. Archiviazione
            if os.path.exists(GENERATED_VIDEO):
                timestamp = datetime.now().strftime("%Y%m%d_%H%M")
                nome_pulito = professione.replace(" ", "_")
                destinazione = os.path.join(OUTPUT_DIR, f"Reel_{nome_pulito}_{timestamp}.mp4")
                
                os.rename(GENERATED_VIDEO, destinazione)
                print(f"[SUCCESS] SFORNATO CON SUCCESSO: Salvato in {destinazione}")
            else:
                print(f"[ERROR] ERRORE CRITICO: Il video non è stato generato.")
                
        except Exception as e:
            print(f"[ERROR] FATAL ERROR sulla nicchia {professione}: {e}")
            
        tempo_impiegato = round(time.time() - start_time)
        print(f"[*] Tempo impiegato per questa nicchia: {tempo_impiegato} secondi.\n")

if __name__ == "__main__":
    crea_fabbrica()
    print("[*] PRODUZIONE DI MASSA COMPLETATA!")
