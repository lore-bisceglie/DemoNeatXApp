import os
from instagrapi import Client

def challenge_code_handler(username, choice):
    if choice == 1 or choice == 2:
        print("\n==========================================")
        print("[!] ATTENZIONE: Instagram ha appena inviato un codice a 6 cifre via Email o SMS.")
        print("==========================================\n")
        return input("Inserisci il codice a 6 cifre ricevuto: ")
    return False

def main():
    cl = Client()
    cl.challenge_code_handler = challenge_code_handler

    # Leggiamo username e password da auto_dm.py
    try:
        from auto_dm import IG_USERNAME, IG_PASSWORD
        USERNAME = IG_USERNAME
        PASSWORD = IG_PASSWORD
    except ImportError:
        USERNAME = "INSERISCI_QUI_IL_TUO_USERNAME"
        PASSWORD = "INSERISCI_QUI_LA_TUA_PASSWORD"

    if USERNAME == "INSERISCI_QUI_IL_TUO_USERNAME":
        print("Errore: devi prima inserire i tuoi dati in auto_dm.py!")
        return

    print(f"[*] Tento l'accesso forzato per {USERNAME}...")
    try:
        cl.login(USERNAME, PASSWORD)
        cl.dump_settings("session.json")
        print("[+] ACCESSO COMPLETATO E SESSIONE SALVATA! Ora il bot Auto-DM funzionerà sempre in automatico.")
    except Exception as e:
        print(f"[!] Errore durante l'accesso: {e}")

if __name__ == "__main__":
    main()
