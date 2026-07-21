import os
from instagrapi import Client

SESSION_ID = os.environ.get("INSTA_SESSION_ID", "13302007152%3AUGUlIBfuHkpX0I%3A19%3AAYjcB0kqQmLTdn1fM6x6AnYV4rvztPFTXABPBE5lLQ")

def check_login():
    cl = Client()
    try:
        cl.login_by_sessionid(SESSION_ID)
        user_info = cl.current_user()
        print(f"✅ Accesso Instagram riuscito! Profilo collegato: @{user_info.username}")
    except Exception as e:
        print(f"❌ Errore di accesso a Instagram: {e}")

if __name__ == "__main__":
    check_login()
