#!/usr/bin/env python3
"""Fix foreign-language country names: 'Other | Belgien | Brugge' -> 'Europe | Belgium | Brugge'."""
import json, urllib.request, time

KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0dXpwc3d4emVuZ3FvcXF3dHB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NzYxMDksImV4cCI6MjA5NDM1MjEwOX0.IFXPHYPWk2fEznegGjDXUVnZ0jhJXRzI4MkWVM-uPpU"
BASE = "https://qtuzpswxzengqoqqwtpt.supabase.co"

# Foreign country -> (English country, correct continent)
FIX = {
    'belgien': ('Belgium', 'Europe'),
    'holland': ('Netherlands', 'Europe'),
    'danmark': ('Denmark', 'Europe'),
    'frankrig': ('France', 'Europe'),
    'tyskland': ('Germany', 'Europe'),
    'deutschland': ('Germany', 'Europe'),
    'sverige': ('Sweden', 'Europe'),
    'polen': ('Poland', 'Europe'),
    'tjekkiet': ('Czech Republic', 'Europe'),
    'schweiz': ('Switzerland', 'Europe'),
    'norge': ('Norway', 'Europe'),
    'kroatien': ('Croatia', 'Europe'),
    'serbien': ('Serbia', 'Europe'),
    'spanien': ('Spain', 'Europe'),
    'italien': ('Italy', 'Europe'),
    'frankreich': ('France', 'Europe'),
    'nederland': ('Netherlands', 'Europe'),
    'oostenrijk': ('Austria', 'Europe'),
    'osterreich': ('Austria', 'Europe'),
    'griekenland': ('Greece', 'Europe'),
    'hongarije': ('Hungary', 'Europe'),
    'roemenië': ('Romania', 'Europe'),
    'bulgarije': ('Bulgaria', 'Europe'),
    'rusland': ('Russian Federation', 'Europe'),
    'türkei': ('Turkey', 'Europe'),
    'marokko': ('Morocco', 'Africa'),
    'brasil': ('Brazil', 'Americas'),
    'méxico': ('Mexico', 'Americas'),
    'nueva zelanda': ('New Zealand', 'Oceania'),
}

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

print("Descargando todos los perfiles...")
profiles = fetch_all("/rest/v1/profiles?select=id,location")

plan = []
for p in profiles:
    loc = p.get('location') or ''
    parts = loc.split(' | ')
    if len(parts) >= 2:
        country = parts[1].strip().lower()
        if country in FIX:
            new_country, new_continent = FIX[country]
            parts[0] = new_continent
            parts[1] = new_country
            new_loc = ' | '.join(parts)
            if new_loc != loc:
                plan.append({"id": p['id'], "old": loc, "new": new_loc})

print(f"Perfiles a corregir: {len(plan)}")
from collections import Counter
c = Counter(item['old'].split(' | ')[1] for item in plan)
for k, n in c.most_common():
    print(f"  {k}: {n}")

with open("/root/shemalewikinew1/foreign_fix_plan.json", "w") as f:
    json.dump(plan, f, indent=2)
print(f"Plan guardado: foreign_fix_plan.json")
