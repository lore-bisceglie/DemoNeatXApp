from playwright.sync_api import sync_playwright
import time
import os

def record_site():
    print("[*] Inizializzazione registrazione automatica dello schermo...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Device scale factor a 2 per simulare un display Retina (massima nitidezza)
        context = browser.new_context(
            viewport={'width': 1080, 'height': 1920},
            record_video_dir="assets",
            record_video_size={'width': 1080, 'height': 1920},
            device_scale_factor=2
        )
        page = context.new_page()
        
        # ==============================================================
        # FASE 1: FLUSSO REALISTICO DI PRENOTAZIONE (Cliente Finale)
        # ==============================================================
        print("[*] Avvio della simulazione utente realista...")
        page.goto("https://www.neatx.store/", wait_until="networkidle")
        time.sleep(1.5)
        
        # 1. Seleziona il servizio (dal menu a tendina)
        print("[*] Seleziono il servizio...")
        try:
            page.locator('select').first.select_option(index=1)
        except:
            print("[!] Fallita selezione servizio, continuo...")
        time.sleep(2)
        
        # 2. Clicca un giorno disponibile nel calendario
        print("[*] Scelgo una data nel calendario...")
        page.evaluate("""
            const days = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.trim().match(/^\\d{1,2}$/) && !b.disabled && !b.hasAttribute('aria-disabled'));
            if (days.length > 0) { days[Math.min(2, days.length-1)].click(); }
        """)
        time.sleep(2)
        
        # 3. Scegli un orario
        print("[*] Scelgo l'orario...")
        page.evaluate("""
            const times = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.includes(':') && !b.disabled);
            if (times.length > 0) { times[Math.floor(times.length/3)].click(); }
        """)
        time.sleep(2)
        
        # 4. Compila dati casuali
        print("[*] Riempimento dati cliente...")
        page.evaluate("""
            const demoBtns = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.toLowerCase().includes('demo'));
            if (demoBtns.length > 0) { demoBtns[0].click(); }
        """)
        time.sleep(2)
        
        # 5. Conferma prenotazione
        print("[*] Confermo la prenotazione...")
        page.evaluate("""
            const confBtns = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.toLowerCase().includes('conferma') || b.innerText.toLowerCase().includes('prenota'));
            if (confBtns.length > 0) { confBtns[0].click(); }
        """)
        time.sleep(3)
        
        # ==============================================================
        # FASE 2: DASHBOARD INTERNA E SCROLLING
        # ==============================================================
        print("[*] Passo alla dashboard e mostro l'agenda...")
        page.goto("https://www.neatx.store/dashboard", wait_until="networkidle")
        time.sleep(3)
        
        page.evaluate("window.scrollBy({top: 400, behavior: 'smooth'})")
        time.sleep(3)
        
        page.evaluate("window.scrollBy({top: 500, behavior: 'smooth'})")
        time.sleep(2)
        
        # Fine registrazione
        path = page.video.path()
        context.close()
        browser.close()
        
        target = "assets/screen_recording.webm"
        if os.path.exists(target):
            os.remove(target)
        os.rename(path, target)
        print(f"[+] Registrazione del flusso umano completata: {target}")

if __name__ == '__main__':
    record_site()
