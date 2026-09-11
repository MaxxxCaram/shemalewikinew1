#!/usr/bin/env python3
"""Apply safe migration: update location for numeric profiles with unambiguous UUID match."""
import json, urllib.request, time

plan = json.load(open("/root/shemalewikinew1/migration_safe_fixes.json"))
print(f"Aplicando {len(plan)} fixes seguros...")

KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0dXpwc3d4emVuZ3FvcXF3dHB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NzYxMDksImV4cCI6MjA5NDM1MjEwOX0.IFXPHYPWk2fEznegGjDXUVnZ0jhJXRzI4MkWVM-uPpU"
BASE = "https://qtuzpswxzengqoqqwtpt.supabase.co"

ok = 0
fail = 0
for fix in plan:
    num_id = fix['numeric_id']
    new_loc = fix['new_location']
    body = json.dumps({"location": new_loc}).encode()
    req = urllib.request.Request(
        f"{BASE}/rest/v1/profiles?id=eq.{num_id}",
        data=body, method="PATCH",
        headers={
            "apikey": KEY,
            "Authorization": f"Bearer {KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        })
    try:
        urllib.request.urlopen(req, timeout=30)
        ok += 1
        print(f"  ✅ {num_id} {fix['name']}: '{fix['old_location']}' → '{new_loc}'")
    except urllib.error.HTTPError as e:
        fail += 1
        print(f"  ❌ {num_id}: HTTP {e.code} {e.read().decode()[:100]}")
    time.sleep(0.2)

print(f"\nResultado: {ok} aplicados, {fail} fallidos")
