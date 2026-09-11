#!/usr/bin/env python3
"""Create launch_leads table in Supabase via service key."""
import json, urllib.request

SERVICE_KEY = open('/tmp/service_key.txt').read().strip()
BASE = "https://qtuzpswxzengqoqqwtpt.supabase.co"

# Usar el endpoint SQL (PostgREST no ejecuta DDL; usar el dashboard API o RPC)
# Alternativa: insertar con un id de prueba para confirmar la tabla existe.
# Mejor: usar el endpoint /rest/v1/rpc con una función... 
# Simplificación: crear tabla via SQL directo no es posible con anon/service via PostgREST.
# Probamos crear la tabla con un POST (si no existe, dará error y sabremos).

# Verificar si la tabla existe intentando un select
r = urllib.request.Request(f"{BASE}/rest/v1/launch_leads?select=id&limit=1",
    headers={"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}"})
try:
    resp = urllib.request.urlopen(r, timeout=20)
    print("launch_leads existe:", resp.status)
except urllib.error.HTTPError as e:
    if e.code == 404:
        print("launch_leads NO existe (404) — hay que crearla")
    else:
        print("Error:", e.code)
