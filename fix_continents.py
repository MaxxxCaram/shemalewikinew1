#!/usr/bin/env python3
"""Fix wrong continent assignments in profiles.location."""
import json, urllib.request, time

KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0dXpwc3d4emVuZ3FvcXF3dHB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NzYxMDksImV4cCI6MjA5NDM1MjEwOX0.IFXPHYPWk2fEznegGjDXUVnZ0jhJXRzI4MkWVM-uPpU"
BASE = "https://qtuzpswxzengqoqqwtpt.supabase.co"

# country -> correct continent
COUNTRY_CONTINENT = {
    'albania': 'Europe', 'austria': 'Europe', 'belarus': 'Europe', 'belgium': 'Europe',
    'bulgaria': 'Europe', 'croatia': 'Europe', 'cyprus': 'Europe', 'denmark': 'Europe',
    'estonia': 'Europe', 'finland': 'Europe', 'france': 'Europe', 'georgia': 'Europe',
    'germany': 'Europe', 'greece': 'Europe', 'hungary': 'Europe', 'iceland': 'Europe',
    'ireland': 'Europe', 'italy': 'Europe', 'kosovo': 'Europe', 'latvia': 'Europe',
    'lithuania': 'Europe', 'luxembourg': 'Europe', 'malta': 'Europe', 'netherlands': 'Europe',
    'spain': 'Europe', 'switzerland': 'Europe', 'united kingdom': 'Europe',
    'poland': 'Europe', 'portugal': 'Europe', 'ukraine': 'Europe', 'norway': 'Europe',
    'sweden': 'Europe', 'denmark': 'Europe', 'czech republic': 'Europe', 'serbia': 'Europe',
    'slovakia': 'Europe', 'slovenia': 'Europe', 'romania': 'Europe', 'moldova': 'Europe',
    'montenegro': 'Europe', 'north macedonia': 'Europe', 'bosnia and herzegovina': 'Europe',
    'albania': 'Europe', 'turkey': 'Europe', 'russian federation': 'Europe',
    'singapore': 'Asia', 'china': 'Asia', 'japan': 'Asia', 'thailand': 'Asia',
    'india': 'Asia', 'hong kong': 'Asia', 'philippines': 'Asia', 'malaysia': 'Asia',
    'indonesia': 'Asia', 'vietnam': 'Asia', 'taiwan': 'Asia', 'south korea': 'Asia',
    'israel': 'Asia', 'lebanon': 'Asia', 'qatar': 'Asia', 'uae': 'Asia',
    'saudi arabia': 'Asia', 'bahrain': 'Asia', 'kuwait': 'Asia', 'jordan': 'Asia',
    'iran': 'Asia', 'iraq': 'Asia', 'armenia': 'Asia', 'azerbaijan': 'Asia',
    'cambodia': 'Asia', 'sri lanka': 'Asia', 'nepal': 'Asia', 'pakistan': 'Asia',
    'myanmar': 'Asia', 'laos': 'Asia', 'bangladesh': 'Asia', 'afghanistan': 'Asia',
    'oman': 'Asia', 'yemen': 'Asia', 'syria': 'Asia', 'mongolia': 'Asia',
    'egypt': 'Africa', 'south africa': 'Africa', 'morocco': 'Africa', 'nigeria': 'Africa',
    'kenya': 'Africa', 'ghana': 'Africa', 'tunisia': 'Africa', 'algeria': 'Africa',
    'ethiopia': 'Africa', 'tanzania': 'Africa', 'uganda': 'Africa', 'zimbabwe': 'Africa',
    'angola': 'Africa', 'mozambique': 'Africa', 'senegal': 'Africa', 'libya': 'Africa',
    'mauritius': 'Africa', 'madagascar': 'Africa', 'cape verde': 'Africa', 'botswana': 'Africa',
    'argentina': 'Americas', 'brazil': 'Americas', 'chile': 'Americas', 'colombia': 'Americas',
    'mexico': 'Americas', 'peru': 'Americas', 'venezuela': 'Americas', 'ecuador': 'Americas',
    'bolivia': 'Americas', 'paraguay': 'Americas', 'uruguay': 'Americas', 'guyana': 'Americas',
    'canada': 'Americas', 'united states': 'Americas', 'costa rica': 'Americas',
    'panama': 'Americas', 'nicaragua': 'Americas', 'honduras': 'Americas',
    'guatemala': 'Americas', 'el salvador': 'Americas', 'belize': 'Americas', 'cuba': 'Americas',
    'dominican republic': 'Americas', 'puerto rico': 'Americas', 'jamaica': 'Americas',
    'trinidad and tobago': 'Americas', 'aruba': 'Americas', 'suriname': 'Americas',
    'australia': 'Oceania', 'new zealand': 'Oceania', 'fiji': 'Oceania', 'papua new guinea': 'Oceania',
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
        except Exception:
            break
        if not isinstance(data, list) or not data:
            break
        results.extend(data)
        offset += limit
        if len(data) < limit:
            break
        time.sleep(0.2)
    return results

print("Descargando perfiles...")
profiles = fetch_all("/rest/v1/profiles?select=id,location")

fixes = []
for p in profiles:
    loc = p.get('location') or ''
    parts = loc.split(' | ')
    if len(parts) >= 2:
        country = parts[1].strip().lower()
        if country in COUNTRY_CONTINENT:
            correct = COUNTRY_CONTINENT[country]
            if parts[0] != correct:
                parts[0] = correct
                fixes.append((p['id'], loc, ' | '.join(parts)))

print(f"Continentes a corregir: {len(fixes)}")
from collections import Counter
c = Counter(f"{old.split(' | ')[0]}→{new.split(' | ')[0]}" for _, old, new in fixes)
for k, n in c.most_common(10):
    print(f"  {k}: {n}")

with open("/root/shemalewikinew1/continent_fixes.json", "w") as f:
    json.dump([{"id": i, "old": o, "new": n} for i, o, n in fixes], f, indent=2)
print(f"\nPlan guardado: continent_fixes.json")
