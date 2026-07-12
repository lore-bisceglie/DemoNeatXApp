import json, os, sys

path = sys.argv[1] if len(sys.argv) > 1 else 'publish_report.json'
if not os.path.exists(path):
    print('Nessun report trovato')
    sys.exit(0)

with open(path) as f:
    r = json.load(f)

for k, v in r.get('results', {}).items():
    ok = v.get('ok')
    icon = '✅' if ok else '❌'
    print(f'{icon} {k}: {v.get("message", "")}')
