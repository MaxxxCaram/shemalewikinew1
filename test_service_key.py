#!/usr/bin/env python3
"""Verify service key write access + fix one profile as a test."""
import json, urllib.request

SERVICE_KEY = open('/tmp/service_key.txt').read().strip()
BASE = "https://qtuzpswxzengqoqqwtpt.supabase.co"

# Test PATCH on profile 9942: Danmark -> Denmark
body = json.dumps({"location": "Europe | Denmark | Copenhagen"}).encode()
req = urllib.request.Request(
    f"{BASE}/rest/v1/profiles?id=eq.9942",
    data=body, method="PATCH",
    headers={"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}",
             "Content-Type": "application/json", "Prefer": "return=representation"})
try:
    r = urllib.request.urlopen(req, timeout=30)
    result = json.load(r)
    print("PATCH OK:", result[0]['location'] if result else 'sin respuesta')
except urllib.error.HTTPError as e:
    print(f"ERROR: HTTP {e.code}: {e.read().decode()[:300]}")
except Exception as e:
    print(f"ERROR: {e}")
