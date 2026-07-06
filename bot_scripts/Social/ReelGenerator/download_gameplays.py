import os
import subprocess
import time

GAMES = [
    "Subway Surfers", "Temple Run 2", "Sonic Dash", "Talking Tom Gold Run",
    "Minion Rush", "Xtreme Rush", "Going Balls", "Craft Sword", "Rail Rush",
    "Agent Dash", "Blades of Brim", "Lara Croft: Relic Run", "Om Nom: Run",
    "Jumanji: Epic Run", "Bus Rush", "Angry Gran Run", "Vector",
    "Run Sausage Run", "Sky Dancer Run", "Smash Hit"
]

def download_gameplays():
    output_dir = "assets/gameplay"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    yt_dlp_exe = "yt-dlp.exe" if os.name == 'nt' else "yt-dlp"
    
    print("==================================================")
    print("INIZIO DOWNLOAD DEI 20 GIOCHI PER IL REEL GENERATOR")
    print("==================================================")
    
    for game in GAMES:
        safe_name = game.replace(" ", "_").replace(":", "")
        # Controlliamo se esiste già un video per questo gioco per saltarlo
        existing_files = [f for f in os.listdir(output_dir) if f.startswith(safe_name) and f.endswith(".mp4")]
        if existing_files:
            print(f"[*] {game} già scaricato: {existing_files[0]}. Salto.")
            continue
            
        print(f"[*] Sto cercando e scaricando: {game}...")
        
        # Cerchiamo un gameplay senza commento, possibilmente in formato verticale (shorts) o generico corto (max 3 min)
        query = f"ytsearch1:{game} gameplay no commentary shorts"
        output_template = f"{output_dir}/{safe_name}.%(ext)s"
        
        command = [
            yt_dlp_exe,
            "--match-filter", "duration < 300",  # Max 5 minuti per evitare file enormi
            "-f", "bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4][height<=1080]/best",
            "-o", output_template,
            query
        ]
        
        try:
            subprocess.run(command, check=True)
            print(f"[+] Download completato per {game}!")
        except Exception as e:
            print(f"[!] Errore durante il download di {game}: {e}")
            
        time.sleep(2) # Pausa per non farci bloccare da YouTube

if __name__ == "__main__":
    download_gameplays()
    print("DOWNLOAD COMPLETATI. I video sono ora nella cartella assets/gameplay/")
