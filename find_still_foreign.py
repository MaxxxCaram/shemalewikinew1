#!/usr/bin/env python3
"""Find ALL profiles still containing foreign country variants anywhere in location."""
import json, urllib.request, time

KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0dXpwc3d4emVuZ3FvcXF3dHB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NzYxMDksImV4cCI6MjA5NDM1MjEwOX0.IFXPHYPWk2fEznegGjDXUVnZ0jhJXRzI4MkWVM-uPpU"
BASE = "https://qtuzpswxzengqoqqwtpt.supabase.co"

def fetch_all(path, limit=1000):
    results = []
    offset = 0
    while True:
        sep = '&' if '?' in path else '?'
        req = urllib.request.Request(
            f"{BASE}{path}{sep}limit={limit}&offset={offset}",
            headers={"apikey": KEY, "Authorization": f"Bearer {KEY}"})
        try:
            data = json.load(urllib.request.urlopen(req, timeout=60))
        except Exception as e:
            print(f"  err offset={offset}: {e}")
            break
        if not isinstance(data, list) or not data:
            break
        results.extend(data)
        offset += limit
        if len(data) < limit:
            break
        time.sleep(0.15)
    return results

profiles = fetch_all("/rest/v1/profiles?select=id,location")
print(f"Total: {len(profiles)}")

variants = ['belgien', 'holland', 'danmark', 'frankrig', 'tyskland', 'sverige',
            'polen', 'tjekkiet', 'schweiz', 'norge', 'kroatien', 'serbien', 'spanien',
            'italien', 'frankreich', 'deutschland', 'nederland', 'oostenrijk', 'osterreich',
            'griekenland', 'hongarije', 'roemenië', 'bulgarije', 'rusland', 'türkei',
            'marokko', 'brasil', 'méxico', 'nueva zelanda']

found = []
for p in profiles:
    loc = (p.get('location') or '').lower()
    for v in variants:
        if v in loc:
            found.append(p)
            break

print(f"Perfiles con variantes: {len(found)}")
from collections import Counter
c = Counter()
for p in found:
    parts = (p.get('location') or '').split(' | ')
    if len(parts) >= 2:
        c[parts[1]] += 1
for k, n in c.most_common():
    print(f"  {k}: {n}")

with open("/root/shemalewikinew1/still_foreign.json", "w") as f:
    json.dump([{"id": p['id'], "location": p['location']} for p in found], f, indent=2)
print(f"\nGuardados: still_foreign.json")
