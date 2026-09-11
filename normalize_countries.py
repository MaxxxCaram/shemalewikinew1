#!/usr/bin/env python3
"""Normalize country names in profiles.location (language variants -> English standard)."""
import json, urllib.request, time, re

KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0dXpwc3d4emVuZ3FvcXF3dHB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NzYxMDksImV4cCI6MjA5NDM1MjEwOX0.IFXPHYPWk2fEznegGjDXUVnZ0jhJXRzI4MkWVM-uPpU"
BASE = "https://qtuzpswxzengqoqqwtpt.supabase.co"

# Language variants -> English standard country name
COUNTRY_MAP = {
    # Dutch
    'belgië': 'Belgium', 'belgie': 'Belgium', 'belgien': 'Belgium',
    'nederland': 'Netherlands', 'holland': 'Netherlands',
    'duitsland': 'Germany', 'tyskland': 'Germany', 'deutschland': 'Germany',
    'frankrijk': 'France', 'frankrig': 'France', 'frankreich': 'France',
    'spanje': 'Spain', 'spanien': 'Spain', 'españa': 'Spain',
    'italië': 'Italy', 'italien': 'Italy',
    'zweden': 'Sweden', 'sverige': 'Sweden', 'schweden': 'Sweden',
    'denemarken': 'Denmark', 'danmark': 'Denmark', 'dänemark': 'Denmark',
    'polen': 'Poland',
    'tsjechië': 'Czech Republic', 'tsjekkia': 'Czech Republic', 'tjekkiet': 'Czech Republic',
    'oostenrijk': 'Austria', 'østrig': 'Austria', 'österreich': 'Austria',
    'zwitserland': 'Switzerland', 'schweiz': 'Switzerland',
    'griekenland': 'Greece',
    'portugal': 'Portugal',
    'ierland': 'Ireland',
    'engeland': 'United Kingdom', 'verenigd koninkrijk': 'United Kingdom',
    'luxemburg': 'Luxembourg',
    'kroatië': 'Croatia', 'kroatien': 'Croatia', 'hrvatska': 'Croatia',
    'servië': 'Serbia', 'serbien': 'Serbia', 'srbija': 'Serbia',
    'noorwegen': 'Norway', 'norge': 'Norway', 'norwegen': 'Norway',
    'finland': 'Finland', 'finnland': 'Finland',
    'hongarije': 'Hungary', 'ungarn': 'Hungary',
    'slowakije': 'Slovakia', 'slowakei': 'Slovakia',
    'slovenië': 'Slovenia', 'slowenien': 'Slovenia',
    'roemenië': 'Romania', 'rumänien': 'Romania',
    'bulgarije': 'Bulgaria', 'bulgarien': 'Bulgaria',
    'rusland': 'Russian Federation', 'russland': 'Russian Federation',
    'ukraine': 'Ukraine',
    'groot-brittannië': 'United Kingdom',
    'tsjechische republiek': 'Czech Republic',
    'spanje (spain)': 'Spain',
    'spanien (spain)': 'Spain',
    # Others seen in data
    'østrig (austria)': 'Austria',
    'croatia (local name: hrvatska)': 'Croatia',
    'people\'s republic of china': 'China',
    'republic of the': 'Philippines',
    'u.s.a.': 'United States', 'usa': 'United States', 'united states of america': 'United States',
    'united arab emirates': 'UAE',
    'south korea': 'South Korea',
    'north korea': 'North Korea',
    'czech republic': 'Czech Republic',
    'philippines': 'Philippines',
    'indonesia': 'Indonesia',
    'thailand': 'Thailand',
    'vietnam': 'Vietnam',
    'malaysia': 'Malaysia',
    'singapore': 'Singapore',
    'hong kong': 'Hong Kong',
    'taiwan': 'Taiwan',
    'russian federation': 'Russian Federation',
    'bosnia and herzegovina': 'Bosnia and Herzegovina',
    'bosnia & herzegovina': 'Bosnia and Herzegovina',
    'macedonia': 'North Macedonia',
    'montenegro': 'Montenegro',
    'albania': 'Albania',
    'kosovo': 'Kosovo',
    'moldova': 'Moldova',
    'belarus': 'Belarus',
    'georgia': 'Georgia',
    'armenia': 'Armenia',
    'azerbaijan': 'Azerbaijan',
    'turkey': 'Turkey', 'türkei': 'Turkey',
    'cyprus': 'Cyprus',
    'malta': 'Malta',
    'iceland': 'Iceland', 'ijsland': 'Iceland', 'island': 'Iceland',
    'lithuania': 'Lithuania', 'litauen': 'Lithuania',
    'latvia': 'Latvia', 'lettland': 'Latvia',
    'estonia': 'Estonia', 'estland': 'Estonia',
    'monaco': 'Monaco',
    'andorra': 'Andorra',
    'liechtenstein': 'Liechtenstein',
    'san marino': 'San Marino',
    'vatican': 'Vatican City',
    'israel': 'Israel',
    'lebanon': 'Lebanon',
    'qatar': 'Qatar',
    'kuwait': 'Kuwait',
    'bahrain': 'Bahrain',
    'oman': 'Oman',
    'saudi arabia': 'Saudi Arabia',
    'jordan': 'Jordan',
    'iran': 'Iran',
    'iraq': 'Iraq',
    'afghanistan': 'Afghanistan',
    'pakistan': 'Pakistan',
    'india': 'India',
    'bangladesh': 'Bangladesh',
    'sri lanka': 'Sri Lanka',
    'nepal': 'Nepal',
    'myanmar': 'Myanmar',
    'cambodia': 'Cambodia',
    'laos': 'Laos',
    'japan': 'Japan', 'japan (日本)': 'Japan',
    'south africa': 'South Africa',
    'egypt': 'Egypt',
    'morocco': 'Morocco', 'marokko': 'Morocco',
    'nigeria': 'Nigeria',
    'kenya': 'Kenya',
    'ghana': 'Ghana',
    'senegal': 'Senegal',
    'tunisia': 'Tunisia',
    'algeria': 'Algeria',
    'libya': 'Libya',
    'ethiopia': 'Ethiopia',
    'tanzania': 'Tanzania',
    'uganda': 'Uganda',
    'zimbabwe': 'Zimbabwe',
    'angola': 'Angola',
    'mozambique': 'Mozambique',
    'madagascar': 'Madagascar',
    'mauritius': 'Mauritius',
    'seyschelles': 'Seychelles',
    'cape verde': 'Cape Verde',
    'canary islands': 'Spain',
    'brazil': 'Brazil', 'brasil': 'Brazil',
    'argentina': 'Argentina',
    'chile': 'Chile',
    'colombia': 'Colombia',
    'mexico': 'Mexico', 'méxico': 'Mexico',
    'peru': 'Peru', 'perú': 'Peru',
    'venezuela': 'Venezuela',
    'ecuador': 'Ecuador',
    'bolivia': 'Bolivia',
    'paraguay': 'Paraguay',
    'uruguay': 'Uruguay',
    'guyana': 'Guyana',
    'suriname': 'Suriname',
    'costa rica': 'Costa Rica',
    'panama': 'Panama', 'panamá': 'Panama',
    'nicaragua': 'Nicaragua',
    'honduras': 'Honduras',
    'guatemala': 'Guatemala',
    'el salvador': 'El Salvador',
    'belize': 'Belize',
    'cuba': 'Cuba',
    'dominican republic': 'Dominican Republic',
    'puerto rico': 'Puerto Rico',
    'jamaica': 'Jamaica',
    'trinidad and tobago': 'Trinidad and Tobago',
    'canada': 'Canada',
    'united states': 'United States',
    'australia': 'Australia',
    'new zealand': 'New Zealand', 'nueva zelanda': 'New Zealand',
    'fiji': 'Fiji',
    'trans': None,  # remove invalid
    'unknown': None,  # handled separately
}

def normalize_location(loc):
    """Normalize country segment in 'Continent | Country | City' format."""
    if not loc:
        return loc
    parts = loc.split(' | ')
    if len(parts) < 2:
        return loc
    country = parts[1].strip().lower()
    if country in COUNTRY_MAP:
        new_country = COUNTRY_MAP[country]
        if new_country is None:
            # invalid country segment — drop the country, keep continent
            return ' | '.join([parts[0]] + parts[2:]) if len(parts) > 2 else parts[0]
        parts[1] = new_country
        return ' | '.join(parts)
    return loc

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
            print(f"  error offset={offset}: {e}")
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

# Pre-analizar qué cambios hay
from collections import Counter
changes = Counter()
to_update = []
for p in profiles:
    new_loc = normalize_location(p.get('location'))
    if new_loc != p.get('location'):
        changes[new_loc.split(' | ')[1] if len(new_loc.split(' | ')) > 1 else '?' ] += 1
        to_update.append((p['id'], p.get('location'), new_loc))

print(f"Perfiles con location a normalizar: {len(to_update)}")
for country, n in changes.most_common(15):
    print(f"  → {country}: {n}")

# Backup del plan
with open("/root/shemalewikinew1/normalize_plan.json", "w") as f:
    json.dump([{"id": i, "old": o, "new": n} for i, o, n in to_update], f, indent=2)
print(f"\nPlan guardado: normalize_plan.json ({len(to_update)} cambios)")
