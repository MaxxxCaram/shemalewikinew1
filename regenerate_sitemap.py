#!/usr/bin/env python3
"""Regenerate sitemap.xml from real data: continents, countries, and profiles."""
import json, urllib.request, time, re

KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0dXpwc3d4emVuZ3FvcXF3dHB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NzYxMDksImV4cCI6MjA5NDM1MjEwOX0.IFXPHYPWk2fEznegGjDXUVnZ0jhJXRzI4MkWVM-uPpU"
BASE = "https://qtuzpswxzengqoqqwtpt.supabase.co"

def fetch_all(path, limit=1000):
    results = []
    offset = 0
    while True:
        sep = '&' if '?' in path else '?'
        req = urllib.request.Request(
            f"{BASE}{path}{sep}limit={limit}&offset={offset}",
            headers={"apikey": KEY, "Authorization": f"Bearer {KEY}"})
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
        time.sleep(0.15)
    return results

def slugify(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')

def fetch_all_paginated_count():
    """Count profiles via Content-Range header."""
    req = urllib.request.Request(f"{BASE}/rest/v1/profiles?select=id", headers={
        "apikey": KEY, "Authorization": f"Bearer {KEY}", "Prefer": "count=exact", "Range": "0-0"})
    r = urllib.request.urlopen(req, timeout=60)
    cr = r.headers.get('content-range', '')
    try:
        return int(cr.split('/')[1])
    except Exception:
        return 0

print("Descargando perfiles...")
profiles = fetch_all("/rest/v1/profiles?select=id,location,cam_chat")
print(f"Perfiles: {len(profiles)}")

# Solo perfiles aprobados/visibles para el sitemap
visible = [p for p in profiles if p.get('cam_chat') != 'rejected']
print(f"Visibles (no rechazados): {len(visible)}")

# Estructura
continents = {}
country_slugs = {}  # (continent, country) -> set of city slugs
profile_urls = []

for p in visible:
    loc = p.get('location') or ''
    parts = loc.split(' | ')
    if len(parts) >= 1:
        cont = parts[0].lower()
        if cont not in ('unknown', 'other'):
            continents[cont] = True
    if len(parts) >= 2 and parts[1] not in ('Unknown', 'trans', 'Transsexuellen'):
        cont = parts[0].lower()
        country = parts[1]
        continents[cont] = True
        country_slugs.setdefault((cont, slugify(country)), set())
        if len(parts) >= 3 and parts[2] not in ('Unknown', ''):
            city = parts[2]
            # Profile page for approved profiles
    if len(parts) >= 2 and parts[1] not in ('Unknown', 'trans', 'Transsexuellen'):
        profile_urls.append(p['id'])

print(f"Continentes: {list(continents.keys())}")
print(f"Países: {len(country_slugs)}")
print(f"Perfiles (URLs): {len(profile_urls)}")

# Generar XML
xml = ['<?xml version="1.0" encoding="UTF-8"?>',
       '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">']

# Home + static
xml.append('  <url><loc>https://shemalewiki.online/</loc><priority>1.0</priority><changefreq>daily</changefreq></url>')
xml.append('  <url><loc>https://buscatrans.com/</loc><priority>1.0</priority><changefreq>daily</changefreq></url>')
xml.append('  <url><loc>https://shemalewiki.online/about</loc><priority>0.5</priority><changefreq>monthly</changefreq></url>')
xml.append('  <url><loc>https://shemalewiki.online/contact</loc><priority>0.5</priority><changefreq>monthly</changefreq></url>')
xml.append('  <url><loc>https://buscatrans.com/sobre-nosotros</loc><priority>0.5</priority><changefreq>monthly</changefreq></url>')
xml.append('  <url><loc>https://buscatrans.com/contacto</loc><priority>0.5</priority><changefreq>monthly</changefreq></url>')

# Continentes + países
for cont in sorted(continents):
    if cont == 'other':
        continue
    xml.append(f'  <url><loc>https://shemalewiki.online/{cont}</loc><priority>0.9</priority><changefreq>weekly</changefreq></url>')

for (cont, country_slug) in sorted(country_slugs):
    xml.append(f'  <url><loc>https://shemalewiki.online/{cont}/{country_slug}</loc><priority>0.8</priority><changefreq>weekly</changefreq></url>')

# Perfiles
for pid in profile_urls:
    xml.append(f'  <url><loc>https://shemalewiki.online/profile/{pid}</loc><priority>0.6</priority><changefreq>monthly</changefreq></url>')

xml.append('</urlset>')
content = '\n'.join(xml)

with open("/root/shemalewikinew1/SHEMALEWIKI.ONLINE/frontend/public/sitemap.xml", "w") as f:
    f.write(content)

print(f"\nSitemap regenerado: {len(profile_urls) + len(country_slugs) + len(continents) + 7} URLs")
