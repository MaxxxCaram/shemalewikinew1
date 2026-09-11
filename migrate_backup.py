#!/usr/bin/env python3
"""Backup profiles/photos from Supabase and analyze ID matching for migration."""
import urllib.request, json, sys, time

KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0dXpwc3d4emVuZ3FvcXF3dHB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NzYxMDksImV4cCI6MjA5NDM1MjEwOX0.IFXPHYPWk2fEznegGjDXUVnZ0jhJXRzI4MkWVM-uPpU"
BASE = "https://qtuzpswxzengqoqqwtpt.supabase.co"

def fetch_all(path, limit=1000):
    """Paginate through a REST endpoint."""
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
            print(f"  error fetching {path} offset={offset}: {e}", file=sys.stderr)
            break
        if not isinstance(data, list) or not data:
            break
        results.extend(data)
        offset += limit
        if len(data) < limit:
            break
        time.sleep(0.3)
    return results

print("=== BACKUP + ANALISIS ===")

# 1. Backup de perfiles
print("\n[1/4] Backup de profiles...")
profiles = fetch_all("/rest/v1/profiles?select=id,name,location,cam_chat,created_at")
with open("/root/shemalewikinew1/backup_profiles.json", "w") as f:
    json.dump(profiles, f)
print(f"  → {len(profiles)} perfiles guardados en backup_profiles.json")

# 2. Backup de fotos
print("[2/4] Backup de photos...")
photos = fetch_all("/rest/v1/photos?select=id,profile_id,photo_url")
with open("/root/shemalewikinew1/backup_photos.json", "w") as f:
    json.dump(photos, f)
print(f"  → {len(photos)} fotos guardadas en backup_photos.json")

# 3. Análisis de matches
print("[3/4] Analizando matches...")
num_profiles = [p for p in profiles if p['id'].isdigit()]
uuid_profiles = [p for p in profiles if not p['id'].isdigit()]
print(f"  Perfiles ID numérico: {len(num_profiles)}")
print(f"  Perfiles ID UUID: {len(uuid_profiles)}")

# Índice de UUID por (nombre, ciudad) normalizado
def city_of(loc):
    parts = (loc or '').split(' | ')
    return parts[-1].strip().lower() if parts else ''

def norm_name(n):
    return (n or '').strip().lower()

uuid_index = {}
for p in uuid_profiles:
    key = (norm_name(p['name']), city_of(p['location']))
    uuid_index.setdefault(key, []).append(p)

matches = 0
photo_reassign = {}  # num_profile_id -> uuid_profile_id
for np in num_profiles:
    key = (norm_name(np['name']), city_of(np['location']))
    if key in uuid_index:
        matches += 1
        photo_reassign[np['id']] = uuid_index[key][0]['id']

print(f"  Matches nombre+ciudad: {matches}/{len(num_profiles)}")

# 4. Fotos que se pueden reasignar
print("[4/4] Fotos a reasignar...")
num_photo_ids = set()
for ph in photos:
    if ph['profile_id'].isdigit():
        num_photo_ids.add(ph['profile_id'])
reassignable = [ph for ph in photos if ph['profile_id'] in photo_reassign]
orphan_photos = [ph for ph in photos if ph['profile_id'].isdigit() and ph['profile_id'] not in photo_reassign]
print(f"  Fotos con profile_id numérico: {len(num_photo_ids)} perfiles con fotos")
print(f"  Fotos reasignables (con match): {len(reassignable)}")
print(f"  Fotos huérfanas (sin match): {len(orphan_photos)}")

# Guardar el plan de migración
plan = {
    "photo_reassign": photo_reassign,
    "reassignable_photos": [ph['id'] for ph in reassignable],
    "orphan_photos": [ph['id'] for ph in orphan_photos],
    "num_profiles_no_match": [p['id'] for p in num_profiles if (norm_name(p['name']), city_of(p['location'])) not in uuid_index]
}
with open("/root/shemalewikinew1/migration_plan.json", "w") as f:
    json.dump(plan, f, indent=2)
print("\n  Plan guardado en migration_plan.json")
print("DONE")
