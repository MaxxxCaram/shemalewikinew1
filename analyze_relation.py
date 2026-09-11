#!/usr/bin/env python3
"""Deep analysis: how do numeric-ID profiles relate to UUID profiles?"""
import json, sys

profiles = json.load(open("/root/shemalewikinew1/backup_profiles.json"))
photos = json.load(open("/root/shemalewikinew1/backup_photos.json"))

num_profiles = [p for p in profiles if p['id'].isdigit()]
uuid_profiles = [p for p in profiles if not p['id'].isdigit()]

print(f"Total perfiles: {len(profiles)}")
print(f"  Numéricos: {len(num_profiles)}")
print(f"  UUID: {len(uuid_profiles)}")

# ¿Cuántos perfiles numéricos tienen fotos?
photos_by_profile = {}
for ph in photos:
    photos_by_profile.setdefault(ph['profile_id'], []).append(ph['id'])

num_with_photos = [p for p in num_profiles if p['id'] in photos_by_profile]
num_without_photos = [p for p in num_profiles if p['id'] not in photos_by_profile]
uuid_with_photos = [p for p in uuid_profiles if p['id'] in photos_by_profile]
uuid_without_photos = [p for p in uuid_profiles if p['id'] not in photos_by_profile]

print(f"\nNuméricos con fotos: {len(num_with_photos)}")
print(f"Numéricos sin fotos: {len(num_without_photos)}")
print(f"UUID con fotos: {len(uuid_with_photos)}")
print(f"UUID sin fotos: {len(uuid_without_photos)}")

# ¿Los perfiles numéricos tienen location válida?
num_with_loc = [p for p in num_profiles if p.get('location') and 'Unknown' not in p['location']]
print(f"\nNuméricos con location válida: {len(num_with_loc)}")

# ¿Hay UUIDs con el mismo nombre que numéricos (sin importar ciudad)?
names_num = {}
for p in num_profiles:
    names_num.setdefault((p.get('name') or '').strip().lower(), []).append(p)

name_matches = 0
for p in uuid_profiles:
    key = (p.get('name') or '').strip().lower()
    if key in names_num:
        name_matches += 1

print(f"UUIDs con nombre que existe en numéricos: {name_matches}/{len(uuid_profiles)}")

# Ejemplos de ambos tipos
print("\n--- 5 ejemplos numéricos (con fotos) ---")
shown = 0
for p in num_with_photos[:5]:
    print(f"  {p['id']} | {p.get('name')} | {p.get('location')} | fotos={len(photos_by_profile.get(p['id'],[]))}")
    shown += 1

print("--- 5 ejemplos UUID (sin fotos) ---")
shown = 0
for p in uuid_without_photos[:5]:
    print(f"  {p['id'][:8]} | {p.get('name')} | {p.get('location')}")
    shown += 1

# ¿Mismo nombre, misma ciudad, distinto formato de nombre?
print("\n--- Comparación directa: numéricos vs UUIDs por nombre ---")
name_count = 0
for p in uuid_without_photos:
    key = (p.get('name') or '').strip().lower()
    if key in names_num:
        np = names_num[key][0]
        name_count += 1
        if name_count <= 5:
            print(f"  UUID '{p.get('name')}' ({p.get('location')}) <=> Num '{np.get('name')}' ({np.get('location')})")
print(f"Total UUID sin fotos con nombre duplicado en numéricos: {name_count}")
