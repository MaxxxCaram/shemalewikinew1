#!/usr/bin/env python3
"""Migration strategy analysis: match numeric-ID profiles (with photos) to UUID profiles (with location)."""
import json, sys, re

profiles = json.load(open("/root/shemalewikinew1/backup_profiles.json"))
photos = json.load(open("/root/shemalewikinew1/backup_photos.json"))

num_profiles = [p for p in profiles if p['id'].isdigit()]
uuid_profiles = [p for p in profiles if not p['id'].isdigit()]

print(f"Numéricos: {len(num_profiles)} | UUID: {len(uuid_profiles)}")

# Fotos por profile_id
photos_by_profile = {}
for ph in photos:
    photos_by_profile.setdefault(ph['profile_id'], []).append(ph['id'])
print(f"Perfiles con fotos: numéricos={len([p for p in num_profiles if p['id'] in photos_by_profile])}, UUID={len([p for p in uuid_profiles if p['id'] in photos_by_profile])}")

def norm_phone(p):
    ph = (p.get('phone') or '').strip()
    ph = re.sub(r'[^0-9]', '', ph)
    if len(ph) >= 7:
        return ph[-9:]  # últimos 9 dígitos, sin prefijo de país
    return None

def norm_name(n):
    return re.sub(r'\s+', ' ', (n or '').strip().lower())

# Match por teléfono
print("\n=== MATCH POR TELÉFONO ===")
num_by_phone = {}
for p in num_profiles:
    ph = norm_phone(p)
    if ph and p['id'] in photos_by_profile:
        num_by_phone.setdefault(ph, []).append(p)

phone_matches = []
for up in uuid_profiles:
    if up['id'] in photos_by_profile:
        continue  # ya tiene fotos
    ph = norm_phone(up)
    if ph and ph in num_by_phone:
        for np in num_by_phone[ph]:
            if norm_name(np.get('name')) == norm_name(up.get('name')):
                phone_matches.append((up, np))

print(f"UUID sin fotos con match teléfono+nombre: {len(phone_matches)}")
for up, np in phone_matches[:8]:
    print(f"  UUID '{up['name']}' {up['location']} (tel {up.get('phone')}) <=> Num '{np['name']}' {np['location']} ({len(photos_by_profile.get(np['id'],[]))} fotos)")

# Match por nombre+ciudad (fuerte)
print("\n=== MATCH POR NOMBRE+CIUDAD ===")
def city_of(loc):
    parts = (loc or '').split(' | ')
    return parts[-1].strip().lower() if parts else ''

city_matches = []
for up in uuid_profiles:
    if up['id'] in photos_by_profile:
        continue
    for np in num_profiles:
        if np['id'] not in photos_by_profile:
            continue
        if norm_name(np.get('name')) == norm_name(up.get('name')) and city_of(np.get('location')) == city_of(up.get('location')):
            if city_of(up.get('location')) and city_of(up.get('location')) != 'unknown':
                city_matches.append((up, np))

print(f"UUID sin fotos con match nombre+ciudad: {len(city_matches)}")
for up, np in city_matches[:8]:
    print(f"  UUID '{up['name']}' {up['location']} <=> Num '{np['name']}' {np['location']} ({len(photos_by_profile.get(np['id'],[]))} fotos)")

# ¿Numéricos con location válida que NO tienen contraparte UUID? -> corregir su location tal cual
print("\n=== NUMÉRICOS CON LOCATION VÁLIDA Y FOTOS ===")
good = [p for p in num_profiles if p['id'] in photos_by_profile and p.get('location') and 'Unknown' not in p['location']]
print(f"Total: {len(good)}")
# Estos ya se muestran correctamente (si el front los alcanza). Verificar cuántos tienen location tipo 'Continente | País | Ciudad'
continents = set()
for p in good:
    parts = (p.get('location') or '').split(' | ')
    if len(parts) >= 2:
        continents.add(parts[0])
print(f"Continentes representados: {continents}")

# Fotos totales involucradas
photo_ids_to_move = set()
for up, np in phone_matches + city_matches:
    photo_ids_to_move.update(photos_by_profile.get(np['id'], []))
print(f"\nFotos a mover en matches (sin duplicar): {len(photo_ids_to_move)}")
