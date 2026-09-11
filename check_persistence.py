#!/usr/bin/env python3
"""Check which prior migrations actually persisted (they used anon key = read-only)."""
import json, urllib.request, time

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
        except Exception as e:
            print(f"  err offset={offset}: {e}")
            break
        if not isinstance(data, list) or not data:
            break
        results.extend(data)
        offset += limit
        if len(data) < limit:
            break
        time.sleep(0.12)
    return results

profiles = fetch_all("/rest/v1/profiles?select=id,location")
by_id = {p['id']: p for p in profiles}

# 1. Check the 19 safe fixes from migration_safe_fixes.json
safe = json.load(open("/root/shemalewikinew1/migration_safe_fixes.json"))
persisted = 0
for fix in safe:
    cur = by_id.get(fix['numeric_id'], {}).get('location', '')
    if cur == fix['new_location']:
        persisted += 1
print(f"19 fixes de migración: {persisted}/19 persistidos")

# 2. Check normalize_plan (964)
norm = json.load(open("/root/shemalewikinew1/normalize_plan.json"))
n_persisted = 0
for item in norm:
    cur = by_id.get(item['id'], {}).get('location', '')
    if cur == item['new']:
        n_persisted += 1
print(f"964 normalizaciones: {n_persisted}/964 persistidas")

# 3. Check continent fixes (33)
cont = json.load(open("/root/shemalewikinew1/continent_fixes.json"))
c_persisted = 0
for item in cont:
    cur = by_id.get(item['id'], {}).get('location', '')
    if cur == item['new']:
        c_persisted += 1
print(f"33 fixes de continente: {c_persisted}/33 persistidos")
