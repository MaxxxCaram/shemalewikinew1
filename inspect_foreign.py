#!/usr/bin/env python3
"""Inspect profiles with foreign-language country names (read-only)."""
import json, urllib.request

KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0dXpwc3d4emVuZ3FvcXF3dHB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NzYxMDksImV4cCI6MjA5NDM1MjEwOX0.IFXPHYPWk2fEznegGjDXUVnZ0jhJXRzI4MkWVM-uPpU"
BASE = "https://qtuzpswxzengqoqqwtpt.supabase.co"

def q(path):
    r = urllib.request.Request(f"{BASE}{path}", headers={"apikey": KEY, "Authorization": f"Bearer {KEY}"})
    return json.load(urllib.request.urlopen(r, timeout=60))

variants = ['belgien', 'holland', 'danmark', 'frankrig', 'tyskland', 'sverige', 'polen', 'tjekkiet', 'østrig', 'schweiz', 'norge', 'kroatien', 'serbien', 'spanien', 'italien', 'deutschland', 'frankreich', 'nederland', 'hongarije', 'oostenrijk', 'griekenland', 'ierland', 'luxemburg', 'finland', 'slovenië', 'slowakije', 'roemenië', 'bulgarije', 'rusland', 'ukraine', 'türkei', 'marokko', 'brasil', 'méxico', 'perú', 'panamá', 'nueva zelanda']

results = []
for v in variants:
    try:
        data = q(f"/rest/v1/profiles?select=id,name,location&location=ilike.%25{v}%25&limit=20")
        if data:
            for p in data:
                results.append((v, p))
    except Exception as e:
        print(f"  err {v}: {e}")

print(f"Perfiles con variantes: {len(results)}")
seen = set()
for v, p in results:
    key = p['id']
    if key in seen:
        continue
    seen.add(key)
    print(f"[{v}] {p['id'][:12]} | {p['name']} | {p['location']}")

# Guardar los IDs únicos para el plan
with open("/root/shemalewikinew1/foreign_country_profiles.json", "w") as f:
    json.dump([{"id": p['id'], "location": p['location'], "variant": v} for v, p in results], f, indent=2)
print(f"\nGuardados en foreign_country_profiles.json")
