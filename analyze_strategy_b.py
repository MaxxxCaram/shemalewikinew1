#!/usr/bin/env python3
"""Strategy B: copy location from UUID profiles to numeric-ID profiles (which have photos)."""
import json, re

profiles = json.load(open("/root/shemalewikinew1/backup_profiles.json"))
photos = json.load(open("/root/shemalewikinew1/backup_photos.json"))

photos_by_profile = {}
for ph in photos:
    photos_by_profile.setdefault(ph['profile_id'], []).append(ph['id'])

num_profiles = [p for p in profiles if p['id'].isdigit()]
uuid_profiles = [p for p in profiles if not p['id'].isdigit()]

def norm_name(n):
    return re.sub(r'\s+', ' ', (n or '').strip().lower())

def has_bad_location(p):
    loc = p.get('location') or ''
    return not loc or 'unknown' in loc.lower()

# Numéricos con fotos y location rota
bad_nums = [p for p in num_profiles if p['id'] in photos_by_profile and has_bad_location(p)]
print(f"Numéricos CON fotos y location rota: {len(bad_nums)}")

# Índice de UUIDs por nombre con location válida
uuid_by_name = {}
for p in uuid_profiles:
    if p.get('location') and 'Unknown' not in p['location']:
        key = norm_name(p['name'])
        if key:
            uuid_by_name.setdefault(key, []).append(p)

# Cuántos bad_nums tienen un UUID con location válida del mismo nombre
fixable = []
for np in bad_nums:
    key = norm_name(np['name'])
    if key in uuid_by_name:
        candidates = [u for u in uuid_by_name[key] if not has_bad_location(u)]
        if candidates:
            fixable.append((np, candidates[0]))

print(f"Corregibles (mismo nombre + UUID con location válida): {len(fixable)}")
for np, up in fixable[:10]:
    print(f"  Num '{np['name']}' ({np['location']}) [{len(photos_by_profile.get(np['id'],[]))} fotos] => '{up['location']}'")

# Cuántos NO son corregibles
not_fixable = [p for p in bad_nums if norm_name(p['name']) not in uuid_by_name]
print(f"\nNo corregibles (sin UUID del mismo nombre): {len(not_fixable)}")

# ¿Hay múltiples candidatos por nombre? (riesgo de ambigüedad)
multi = {k: v for k, v in uuid_by_name.items() if len(v) > 1 and k in {norm_name(p['name']) for p in bad_nums}}
print(f"Nombres con múltiples UUIDs candidatos: {len(multi)}")
for k, v in list(multi.items())[:5]:
    print(f"  '{k}': {len(v)} UUIDs -> {[u['location'] for u in v[:4]]}")
