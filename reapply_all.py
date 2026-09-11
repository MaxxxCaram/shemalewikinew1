#!/usr/bin/env python3
"""Re-apply ALL migrations with SERVICE KEY: 19 fixes + 964 normalizations + 33 continent fixes + 51 foreign."""
import json, urllib.request, time

SERVICE_KEY = open('/tmp/service_key.txt').read().strip()
BASE = "https://qtuzpswxzengqoqqwtpt.supabase.co"

def apply_plan(name, plan, loc_key='new'):
    ok = 0
    fail = 0
    for item in plan:
        new_loc = item[loc_key]
        body = json.dumps({"location": new_loc}).encode()
        req = urllib.request.Request(
            f"{BASE}/rest/v1/profiles?id=eq.{item['id']}",
            data=body, method="PATCH",
            headers={"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}",
                     "Content-Type": "application/json", "Prefer": "return=minimal"})
        try:
            urllib.request.urlopen(req, timeout=30)
            ok += 1
        except Exception as e:
            fail += 1
            print(f"  ❌ {item['id']}: {e}")
        time.sleep(0.1)
    print(f"{name}: {ok} aplicados, {fail} fallidos")
    return ok

# 1. Migración segura (19)
safe = json.load(open("/root/shemalewikinew1/migration_safe_fixes.json"))
# El formato tiene numeric_id y new_location
safe_plan = [{"id": s['numeric_id'], "new": s['new_location']} for s in safe]
apply_plan("19 fixes migración", safe_plan)

# 2. Normalización países (964)
norm = json.load(open("/root/shemalewikinew1/normalize_plan.json"))
apply_plan("964 normalizaciones", norm)

# 3. Fix continentes (33)
cont = json.load(open("/root/shemalewikinew1/continent_fixes.json"))
apply_plan("33 fixes continente", cont)

# 4. Países extranjeros (51)
foreign = json.load(open("/root/shemalewikinew1/foreign_fix_plan.json"))
apply_plan("51 países extranjeros", foreign)

print("\nTODAS LAS MIGRACIONES REAPLICADAS")
