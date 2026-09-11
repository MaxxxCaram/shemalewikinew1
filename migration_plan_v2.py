#!/usr/bin/env python3
"""Migration plan v2: unambiguous matches only + HTML-based recovery for the rest."""
import json, re, os, glob

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

bad_nums = [p for p in num_profiles if p['id'] in photos_by_profile and has_bad_location(p)]

# UUIDs por nombre, solo los de location válida
uuid_by_name = {}
for p in uuid_profiles:
    if p.get('location') and 'Unknown' not in p['location']:
        key = norm_name(p['name'])
        if key:
            uuid_by_name.setdefault(key, []).append(p)

# Solo nombres con EXACTAMENTE UN UUID candidato y con location válida
safe_fixes = []  # (num_profile, uuid_profile)
ambiguous = []
for np in bad_nums:
    key = norm_name(np['name'])
    if key not in uuid_by_name:
        continue
    cands = [u for u in uuid_by_name[key] if u.get('location') and 'Unknown' not in u['location']]
    if len(cands) == 1:
        safe_fixes.append((np, cands[0]))
    else:
        ambiguous.append((np, cands))

print(f"Matches SEGUROS (1 único UUID): {len(safe_fixes)}")
print(f"Ambiguos (múltiples UUIDs): {len(ambiguous)}")

# Guardar plan de fixes seguros
plan = []
for np, up in safe_fixes:
    plan.append({
        "numeric_id": np['id'],
        "name": np['name'],
        "old_location": np.get('location'),
        "new_location": up['location'],
        "photo_count": len(photos_by_profile.get(np['id'], []))
    })
with open("/root/shemalewikinew1/migration_safe_fixes.json", "w") as f:
    json.dump(plan, f, indent=2)
print(f"\nPlan seguro guardado: {len(plan)} fixes")
total_photos = sum(p["photo_count"] for p in plan)
print(f"Fotos que ganan ubicación: {total_photos}")

# Revisar HTML disponibles para el resto
html_dir = "/root/shemalewikinew1/SHEMALEWIKI.ONLINE/shemalewiki_recovery/html"
if os.path.isdir(html_dir):
    htmls = glob.glob(f"{html_dir}/*.html") + glob.glob(f"{html_dir}/*/*.html")
    print(f"\nHTMLs descargados: {len(htmls)}")
    # Verificar si los nombres de archivo son IDs numéricos
    sample = [os.path.basename(h) for h in htmls[:5]]
    print(f"  Muestra: {sample}")
else:
    print(f"\nDirectorio HTML no existe: {html_dir}")
    # buscar alternativas
    for cand in ["/root/shemalewikinew1/SHEMALEWIKI.ONLINE/shemalewiki_recovery", "/root/shemalewikinew1/shemalewiki_recovery"]:
        if os.path.isdir(cand):
            print(f"  Existe: {cand}")
