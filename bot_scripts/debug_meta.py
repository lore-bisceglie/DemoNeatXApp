import os
import requests
import json

token = os.environ.get("META_ACCESS_TOKEN")
if not token:
    print("NO TOKEN")
    exit(1)

print("--- DEBUG TOKEN META ---")
url = f"https://graph.facebook.com/debug_token?input_token={token}&access_token={token}"
res = requests.get(url).json()
print(json.dumps(res, indent=2))

print("\n--- DEBUG PERMISSIONS ---")
url2 = f"https://graph.facebook.com/v21.0/me/permissions?access_token={token}"
res2 = requests.get(url2).json()
print(json.dumps(res2, indent=2))

print("\n--- DEBUG IG ACCOUNTS ---")
url3 = f"https://graph.facebook.com/v21.0/me/accounts?fields=instagram_business_account&access_token={token}"
res3 = requests.get(url3).json()
print(json.dumps(res3, indent=2))

print("\n--- DONE ---")
