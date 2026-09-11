#!/usr/bin/env python3
"""Apply all foreign country fixes with SERVICE KEY (write access)."""
import json, urllib.request, time

SERVICE_KEY = open('/tmp/service_key.txt').read().strip()
BASE = "https://qtuzpswxzengqoqqwtpt.supabase.co"

plan = json.load(open("/root/shemalewikinew1/foreign_fix_plan.json"))
print(f"Aplicando {len(plan)} correcciones con service key...")

ok = 0
fail = 0
for item in plan:
    body = json.dumps({"location": item['new']}).encode()
    req = urllib.request.Request(
        f"{BASE}/rest/v1/profiles?id=eq.{item['id']}",
        data=body, method="PATCH",
        headers={"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}",
                 "Content-Type": "application/json", "Prefer": "return=minimal"})
    try:
        urllib.request.urlopen(req, timeout=30)
        ok += 1
    except urllib.error.HTTPError as e:
        fail += 1
        print(f"  ❌ {item['id']}: HTTP {e.code}")
    except Exception as e:
        fail += 1
        print(f"  ❌ {item['id']}: {e}")
    time.sleep(0.12)

print(f"\nResultado: {ok} aplicados, {fail} fallidos")
