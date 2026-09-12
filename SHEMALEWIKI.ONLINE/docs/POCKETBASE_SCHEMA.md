# PocketBase Schema — shemalewiki.online

> Estado real de https://api.shemalewiki.online (PocketBase en VPS Hostinger, SQLite en `/opt/pocketbase/pb_data/data.db`).
> Última actualización: FASE 2 (relation + owner rules en photos y services).

## Colecciones

### users (Auth)
Autenticación de chicas/usuarios del panel.

### profiles
Perfiles públicos. `owner` Relation → users, single, nullable (perfiles legacy = null).

Reglas (FASE 0):
- Escritura (create/update/delete): solo superusers.
- List/View: público, solo `status = "approved"`.

### photos
Fotos de perfiles. **`profile_id` es Relation → profiles (single, required)** — convertido desde text en FASE 2 (migración: campo nuevo `profile_rel` relation → copia SQL de 34,917 valores → drop del text → rename).

Reglas (FASE 2):
```
createRule: @request.auth.id != "" && profile_id.owner = @request.auth.id
updateRule: @request.auth.id != "" && profile_id.owner = @request.auth.id
deleteRule: @request.auth.id != "" && profile_id.owner = @request.auth.id
```
Es decir: solo la dueña del perfil crea/edita/borra sus fotos. Anónimos y cuentas ajenas → bloqueados. Los perfiles legacy sin owner no son editables por nadie excepto superusers.

Campo `file` (file, real) — las fotos se suben directo a PB files. `photo_url` legacy (solo lectura en front via photoFilter.js).

### services
Servicios por perfil. **`profile_id` es Relation → profiles (single, required)** — misma conversión que photos (FASE 2, 13,367 valores migrados).

Reglas (FASE 2): idénticas a photos (owner-only). Antes: superusers only (no explotable pero sin editor cliente).

### claims (FASE 1)
Reclamo de un perfil legacy por su dueña real.

Campos:
- `profile` Relation → profiles, single, required
- `claimant_user` Relation → users, single, required
- `evidence` text (max 5000)
- `contact_proof` file opcional (jpg/png/pdf, 5MB)
- `status` select: pending/approved/rejected (default pending)

Reglas:
- List/View: `claimant_user = @request.auth.id`
- Create: `@request.auth.id != "" && claimant_user = @request.auth.id`
- Update/Delete: solo superusers (admin aprueba → setea `profiles.owner`)

### profile_contacts
PII (phone/whatsapp/email) separada del perfil público. View solo autenticado. Servida al público vía `/api/contact-info` (rate-limit).

### ads
Banners propios (sin TrafficJunky/ExoClick). Escritura superusers-only.

## Flujo de registro (FASE 1)
1. Cliente → `POST /api/register` (serverless Vercel, CORS con www, honeypot, rate-limit).
2. Server crea `users` + `profiles` (owner = user.id, status='pending') con token admin. Devuelve `pbToken` (token del user nuevo).
3. Cliente sube fotos a `photos/records` con `Authorization: Bearer <pbToken>` — la regla owner valida.
4. Admin aprueba en `/api/admin` (login superuser) → status approved / claims → owner.

## Serverless functions (7, límite Hobby: 12)
`register.js`, `admin.js`, `contact-info.js`, `contact.js`, `geo.js`, `image.js`, `vivas/chat.js`.

Eliminados en FASE 1 (sin auth o reemplazados): `auth/login.js` (password plaintext), `update-profile.js`, `upload-photos.js`, `manage-photos.js`, `claims.js`, `profiles.js`.

## Pendientes (FASE 2+)
- Limpieza de datos: `cam_chat` → `status`, `is_verified` booleano real, normalizar ubicaciones (ciudades belgas bajo Netherlands).
- 4,943 perfiles sin foto/con URLs muertas: decisión delete vs ocultar (recomendado: ocultar 770 con fotos muertas).
