#!/usr/bin/env python3
"""Scan ALL photos, find profiles with GOOD loadable photos (>=20KB, real images)."""
import json, urllib.request, time, io

SERVICE_KEY = open('/tmp/service_key.txt').read().strip()
BASE = "https://qtuzpswxzengqoqqwtpt.supabase.co"

def fetch_all(path, limit=1000):
    results = []
    offset = 0
    while True:
        sep = '&' if '?' in path else '?'
        req = urllib.request.Request(
            f"{BASE}{path}{sep}limit={limit}&offset={offset}",
            headers={"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}"})
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
        time.sleep(0.15)
    return results

print("Descargando todas las fotos...")
photos = fetch_all("/rest/v1/photos?select=id,profile_id,photo_url")
print(f"Total fotos: {len(photos)}")

def check_image(url):
    """Check if image is real and its size via GET (HEAD may lie on some CDNs)."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0"})
        r = urllib.request.urlopen(req, timeout=25)
        data = r.read()
        size = len(data)
        ctype = r.headers.get('content-type', '')
        return size, ctype
    except Exception:
        return 0, ''

# Probar las fotos candidatas: priorizar storage (cargables) y archive (via proxy)
GOOD = {}
for ph in photos:
    url = ph.get('photo_url') or ''
    if not url:
        continue
    # Solo fotos de storage (cargan en browser) o archive (via proxy)
    if 'supabase.co/storage' in url or 'web.archive.org' in url:
        pid = ph['profile_id']
        GOOD.setdefault(pid, []).append(url)

print(f"Perfiles con fotos candidatas: {len(GOOD)}")

# Verificar tamaños de las primeras fotos de cada perfil (hasta 150 perfiles)
results = []
for i, (pid, urls) in enumerate(GOOD.items()):
    if i >= 200:
        break
    best = 0
    for url in urls[:4]:  # probar hasta 4 fotos por perfil
        size, _ = check_image(url)
        if size > best:
            best = size
        time.sleep(0.1)
        if best >= 30000:
            break
    results.append({"profile_id": pid, "best_size": best, "n_photos": len(urls)})
    if i % 25 == 0:
        print(f"  probados {i+1} perfiles...")

good_profiles = [r for r in results if r['best_size'] >= 20000]
good_profiles.sort(key=lambda r: -r['best_size'])
print(f"\nPerfiles con foto buena (>=20KB): {len(good_profiles)}")
for r in good_profiles[:30]:
    print(f"  {r['profile_id'][:16]} | {r['best_size']} bytes | {r['n_photos']} fotos")

json.dump(good_profiles, open("/root/shemalewikinew1/good_photo_profiles.json", "w"), indent=2)
print(f"\nGuardado en good_photo_profiles.json")
