#!/usr/bin/env python3
"""Apply foreign country fixes from foreign_fix_plan.json."""
import json, urllib.request, time

KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0dXpwc3d4emVuZ3FvcXF3dHB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NzYxMDksImV4cCI6MjA5NDM1MjEwOX0.IFXPHYPWk2fEznegGjDXUVnZ0jhJXRzI4MkWVM-uPpU"
BASE = "https://qtuzpswxzengqoqqwtpt.supabase.co"

plan = json.load(open("/root/shemalewikinew1/foreign_fix_plan.json"))
print(f"Aplicando {len(plan)} correcciones...")

ok = 0
fail = 0
for item in plan:
    body = json.dumps({"location": item['new']}).encode()
    req = urllib.request.Request(
        f"{BASE}/rest/v1/profiles?id=eq.{item['id']}",
        data=body, method="PATCH",
        headers={"apikey": KEY, "Authorization": f"Bearer {KEY}",
                 "Content-Type": "application/json", "Prefer": "return=minimal"})
    try:
        urllib.request.urlopen(req, timeout=30)
        ok += 1
        print(f"  ✅ {item['id'][:12]} | {item['old'].split(' | ')[1]} → {item['new']}")
    except Exception as e:
        fail += 1
        print(f"  ❌ {item['id']}: {e}")
    time.sleep(0.15)

print(f"\nResultado: {ok} aplicados, {fail} fallidos")
