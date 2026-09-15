# ShemaleWiki Online — Arquitectura del Sistema

> **Última actualización:** Septiembre 2026  
> **Dominios:** shemalewiki.online · buscatrans.com · distintos.net  
> **Autora:** Victoria Caram (Maxima)

---

## 1. Infraestructura

### Servicios

| Servicio | Plataforma | Ubicación | Acceso |
|----------|-----------|-----------|--------|
| **Frontend** (SPA React) | Vercel (Hobby) | Edge network | https://shemalewiki.online |
| **API Backend** (PocketBase) | VPS Hostinger | 187.77.68.200:8080 | Interno (127.0.0.1), expuesto vía Traefik |
| **Proxy inverso** | Traefik (Docker) | Misma VPS | :80/:443 → ruteo por host |
| **Datos** | SQLite | /opt/pocketbase/pb_data/data.db | Local VPS |

### Red

```
Usuario → Cloudflare (distintas.net)
              ↓
Internet → Traefik (:443)
              ├── api.shemalewiki.online → 127.0.0.1:8080 (PocketBase)
              ├── distintas.net → 127.0.0.1:8080 (PocketBase admin UI via /_/)
              └── (otros sitios en la VPS)
              
Usuario → Vercel Edge (shemalewiki.online, buscatrans.com)
              ↓ fetch
         api.shemalewiki.online → Traefik → PocketBase
```

### Certificados HTTPS

Traefik genera certificados Let's Encrypt automáticamente para `api.shemalewiki.online`, `distintas.net`, `www.shemalewiki.online`. Vercel maneja sus propios certificados.

---

## 2. Frontend (Vercel)

**Stack:** React 19 + Vite 8 + React Router 7 + PocketBase REST (vía wrapper tipo Supabase)

**Estructura:**
```
frontend/
├── src/
│   ├── pages/          # 32 páginas (Home, ProfilesList, Profile, Admin, Dashboard, etc.)
│   ├── components/     # UI reutilizable (PhotoCropModal, WorldMap, AdSlot, LazyImage)
│   ├── api/            # Serverless functions Vercel (7 total, límite Hobby: 12)
│   │   ├── admin.js         # Login superuser + CRUD perfiles/fotos
│   │   ├── register.js      # Registro users+profiles, devuelve pbToken
│   │   ├── contact-info.js  # PII rate-limitada
│   │   ├── contact.js       # Formulario de contacto
│   │   ├── image.js         # Proxy de imágenes externas
│   │   ├── lead.js          # Captura de leads
│   │   └── vives/chat.js    # Chat en vivo
│   ├── supabase.js     # Wrapper PocketBase (drop-in replacement, mismo query builder)
│   ├── utils.js        # getProxiedImageUrl, NO_PHOTO_SVG
│   └── utils/          # photoFilter.js (isLoadablePhoto, hasRealFile)
├── test/               # Vitest + Testing Library (21 tests)
└── vercel.json         # Rewrites: /api/* → funciones, resto → SPA
```

**Flujo de datos:**
1. Home/ProfilesList → `supabase.from('profiles').select('*').eq('status','approved')` → PB REST
2. Fotos: `GET /api/collections/photos/records?filter=(profile_id='xxx')` → URLs `/api/files/photos/{id}/{file}`
3. Registro: `POST /api/register` → serverless crea users+profiles con token admin, devuelve pbToken
4. Admin: Login via `POST /api/admins/auth-with-password` → JWT guardado en localStorage

---

## 3. Backend (PocketBase)

**Versión:** 0.22.21  
**Admin:** admin@shemalewiki.online / Aria2026!  
**Token:** se regenera con `pocketbase admin update` + `POST /api/admins/auth-with-password`

### Colecciones

| Colección | Campos clave | Reglas |
|-----------|-------------|--------|
| **users** | email, password, name | Auth collection |
| **profiles** | name, bio, location, status, is_verified, owner (→users) | List/View: público si approved. Write: superusers. |
| **photos** | profile_id (→profiles), file, photo_url, local_path, profile_rel | Create/Update/Delete: owner del perfil. |
| **services** | profile_id (→profiles), service_name, available | Owner-only write. |
| **claims** | profile (→profiles), claimant_user (→users), evidence, status | Create: auth user. Update: superusers. |
| **profile_contacts** | profile_id, phone, whatsapp, email | View: autenticado. Servido vía /api/contact-info con rate-limit. |
| **ads** | slot, image_url, link, audience, active | Write: superusers. |

### Reglas de seguridad (FASE 2)

```javascript
// profiles — solo approved son públicas
List/View: status = "approved"
Create/Update/Delete: @request.auth.id != "" && (owner = @request.auth.id || @auth.isSuperuser = true)

// photos — owner-only
Create: @request.auth.id != "" && profile_id.owner = @request.auth.id
Update/Delete: @request.auth.id != "" && profile_id.owner = @request.auth.id
```

---

## 4. Pipeline de Fotos

**Problema original:** 92k+ fotos con sello de agua "DISTINTAS.NET" y caras borradas.

**Solución:** LaMa inpainting en GPU (NVIDIA RTX 4090).

### Worker (GPU)

**Script:** `gpu_worker_v9.py` (vast.ai `fruce`)  
**Modelo:** `big-lama.pt` (torch.jit, ~200MB)  
**Detección de sello:** gradiente vertical alto en banda 44-56% de altura + 2a línea 56-62%  
**Inpainting:** LaMa rellena la zona enmascarada con contenido generado

### Procesamiento

```
VPS (tar.gz) → scp → GPU vast.ai → worker → scp → VPS → PocketBase
```

**Rendimiento:** ~4 fotos/segundo → 24k fotos en ~1.5h  
**Costo:** ~$0.13-0.44/h (vast.ai) → ~$0.30 USD por corrida de 24k fotos

### Estado

- ✅ España: 27,679 fotos (531 perfiles)
- ✅ Francia: 56,462 fotos (748 perfiles)
- ✅ México: 24,271 fotos (463 perfiles)
- ✅ Netherlands: ~2,276 fotos (117 perfiles)
- ⚠️ Kinky.nl: NO procesado (regla: solo fotos de distintas.net)

---

## 5. Dominios y Ruteo

### Traefik (docker-compose)

```yaml
# docker/traefik/dynamic/pocketbase.yml
http:
  routers:
    pocketbase:
      rule: Host(`api.shemalewiki.online`)
      service: pocketbase
      tls:
        certResolver: letsencrypt
  services:
    pocketbase:
      loadBalancer:
        servers:
          - url: http://127.0.0.1:8080
```

### Vercel (vercel.json)

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1.js" },
    { "source": "/((?!assets/|api/|favicon).*)", "destination": "/index.html" }
  ]
}
```

---

## 6. CI/CD (GitHub Actions)

**Archivo:** `.github/workflows/ci.yml`  
**Trigger:** push/PR a main

### Pipeline

```
push → Lint (no-bloqueante, max-warnings=50)
           ↓
       Test (21 tests, bloqueante)
           ↓
       Build (Vite production)
           ↓
       Deploy (Vercel --prod)
```

### Secrets requeridos

| Secret | Origen |
|--------|--------|
| `VERCEL_TOKEN` | vercel.com → Settings → Tokens |
| `VERCEL_ORG_ID` | team_5bIXoa0j70RZOHzsOzbOOOTN |
| `VERCEL_PROJECT_ID` | prj_c4YIj2Wuzd2PbqzypJcofKrFjQqc |

---

## 7. Operación diaria

### Deploy de código

```bash
git push origin main   # CI corre automáticamente
```

### Deploy manual (emergencia)

```bash
cd /root/shemalewikinew1/SHEMALEWIKI.ONLINE/frontend
vercel --prod
```

### Cambiar password admin PB

```bash
/opt/pocketbase/pocketbase admin update admin@shemalewikionline.online 'NuevoPass!'
```

### Regenerar token (scripts)

```bash
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"identity":"admin@shemalewiki.online","password":"Aria2026!"}' \
  http://127.0.0.1:8080/api/admins/auth-with-password
```

### Backup PocketBase

```bash
cp /opt/pocketbase/pb_data/data.db /tmp/pb_backup_$(date +%Y%m%d).db
```

### Monitoreo básico

- **Sitio:** `curl -sI https://shemalewiki.online/` → 200
- **API:** `curl -s https://api.shemalewiki.online/api/health` → `{"message":"API is healthy."}`
- **Disco VPS:** `df -h /` (alertar si >85%)

---

## 8. Tareas pendientes

- [ ] Limpiar 8 errores de lint en Dashboard.jsx/Profile.jsx
- [ ] Reducir baseline de warnings de 50 a 0
- [ ] Implementar refresh token en admin panel (evitar expiración 24h)
- [ ] Agregar tests e2e (Playwright) para flujo de registro y admin
- [ ] Configurar alertas de uptime (UptimeRobot o similar)
- [ ] Migrar `cam_chat` → `status` en profiles
- [ ] Normalizar ubicaciones (ciudades belgas actualmente bajo Netherlands)
- [ ] Eliminar/ocultar 770 perfiles con fotos muertas

---

## 9. Contactos y recursos

- **VPS:** vast.ai instance #50868323 (puede destruirse, GPU ya no necesaria)
- **PocketBase admin:** https://api.shemalewiki.online/_/
- **Repo:** https://github.com/MaxxxCaram/shemalewikinew1
- **Deploy staging:** automático en PRs (preview de Vercel)

---

*Documento mantenido por Architect (Hermes Agent). Actualizar al cambiar infraestructura.*
