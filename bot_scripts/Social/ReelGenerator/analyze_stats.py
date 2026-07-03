import os
import json
import subprocess

HISTORY_FILE = "history.json"

def update_history_stats():
    if not os.path.exists(HISTORY_FILE):
        print("[*] Nessuna cronologia trovata.")
        return False
        
    with open(HISTORY_FILE, "r", encoding="utf-8") as f:
        try:
            history = json.load(f)
        except:
            print("[!] Errore lettura history.json")
            return False
            
    if not history:
        print("[*] Cronologia vuota.")
        return False
        
    updated = False
    
    # Assicuriamoci che yt-dlp esista
    yt_dlp_path = ".\\yt-dlp.exe" if os.name == 'nt' else "yt-dlp"
    
    for record in history:
        video_id = record.get("youtube_id")
        if not video_id:
            continue
            
        print(f"[*] Analizzando statistiche per il video: {video_id}...")
        try:
            url = f"https://www.youtube.com/watch?v={video_id}"
            
            # Usiamo yt-dlp per prendere le stats senza autenticazione
            result = subprocess.run([yt_dlp_path, "--dump-json", url], capture_output=True, text=True)
            if result.returncode == 0:
                data = json.loads(result.stdout)
                
                views = int(data.get("view_count", 0))
                likes = int(data.get("like_count") or 0)
                
                # Aggiorna se i numeri sono cambiati
                if record.get("views", 0) != views or record.get("likes", 0) != likes:
                    record["views"] = views
                    record["likes"] = likes
                    updated = True
                    print(f"[*] Aggiornato video {video_id}: {views} visualizzazioni, {likes} likes.")
            else:
                print(f"[!] Impossibile estrarre dati per {video_id}.")
        except Exception as e:
            print(f"[!] Errore recupero statistiche per {video_id}: {e}")
            
    if updated:
        with open(HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(history, f, indent=4)
        print("[+] Cronologia aggiornata con successo!")
    else:
        print("[*] Nessuna novità nelle statistiche.")
        
    return True

if __name__ == "__main__":
    update_history_stats()
