import os
import re
from datetime import datetime
import google.generativeai as genai

BLOG_DIR = r"C:\Users\Lxxmtq\Documents\Korsakoff\NeatX\DemoNeatXApp\content\blog"

def setup_gemini():
    try:
        with open("../Social/ReelGenerator/auto_bot.py", "r", encoding="utf-8") as f:
            content = f.read()
            match = re.search(r'GEMINI_API_KEY\s*=\s*"([^"]+)"', content)
            if match:
                genai.configure(api_key=match.group(1))
                return True
    except Exception as e:
        print(f"[!] Errore recupero API Key: {e}")
    return False

def genera_articolo_seo(argomento):
    print(f"\n[*] Analisi SEO in corso per l'argomento: '{argomento}'...")
    
    # Usiamo il modello Pro per la scrittura lunga
    model = genai.GenerativeModel('gemini-1.5-flash', generation_config={"response_mime_type": "text/plain"})
    
    prompt = f"""
Sei un Copywriter SEO esperto di posizionamento su Google e un venditore persuasivo.
Devi scrivere un articolo di blog completo, ottimizzato per i motori di ricerca, sull'argomento: "{argomento}".

Il tuo obiettivo finale è convincere il lettore che 'NeatX' (un'app innovativa per la gestione automatica degli appuntamenti 24/7) è la soluzione definitiva ai loro problemi.

Struttura richiesta per l'articolo (in formato Markdown):
1. **Titolo SEO (H1):** Accattivante, che includa la parola chiave principale.
2. **Introduzione:** Usa la tecnica PAS (Problem, Agitation, Solution).
3. **Corpo dell'articolo (H2 e H3):** Dai consigli REALI e utili su come gestire meglio l'attività.
4. **Presentazione di NeatX (H2):** Spiega come NeatX risolve tutti i problemi menzionati.
5. **Call to Action (H2):** Un forte invito a provare NeatX.

Regole:
- Scrivi in italiano, tono professionale ma coinvolgente.
- L'articolo deve essere di almeno 400 parole.
- Non includere frontmatter, restituisci solo il Markdown pulito partendo da # Titolo.
"""
    try:
        print("[*] Gemini sta scrivendo l'articolo (potrebbe richiedere 10-20 secondi)...")
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"[!] Errore durante la generazione con Gemini: {e}")
        return None

def salva_articolo(testo, argomento):
    if not os.path.exists(BLOG_DIR):
        os.makedirs(BLOG_DIR)
        
    nome_pulito = re.sub(r'[^a-zA-Z0-9]', '-', argomento).lower().strip('-')
    data_odierna = datetime.now().strftime("%Y-%m-%d")
    slug = nome_pulito
    nome_file = f"{slug}.md"
    
    frontmatter = f"---\ntitle: \"Gestione e Consigli: {argomento}\"\ndate: \"{data_odierna}\"\ndescription: \"Scopri la guida definitiva SEO su {argomento} e come ottimizzare il tuo business con NeatX.\"\nslug: \"{slug}\"\n---\n\n"
    
    path_completo = os.path.join(BLOG_DIR, nome_file)
    with open(path_completo, "w", encoding="utf-8") as f:
        f.write(frontmatter + testo)
        
    print(f"\n[+] ARTICOLO GENERATO CON SUCCESSO E INTEGRATO NELL'APP!")
    print(f"[+] Salvato in: {path_completo}")

if __name__ == "__main__":
    print("=========================================")
    print("        NEATX SEO MACHINE (BLOG)         ")
    print("=========================================")
    if setup_gemini():
        argomento = input("\n[?] Inserisci l'argomento (es. 'Gestione appuntamenti Tatuatori'): ")
        if argomento.strip():
            articolo = genera_articolo_seo(argomento.strip())
            if articolo:
                salva_articolo(articolo, argomento.strip())
    else:
        print("[!] Errore: Configurazione API fallita. Verifica il file auto_bot.py")
