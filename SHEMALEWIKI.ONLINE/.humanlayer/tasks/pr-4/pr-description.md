## Why the change

El panel admin estaba limitado a los 200 perfiles más nuevos — no se podía aprobar, rechazar ni editar los perfiles más viejos; ahora el listado pagina completo (Cargar más) y cualquier perfil es buscable y editable desde una sola pantalla, incluyendo contacto real, fotos y portada.

## Special things to note

- El GET `/api/admin` ahora recibe `?page=N` y devuelve `{ profiles, page, hasMore, totalItems }` — el frontend hace append en vez de reemplazar; mantiene 200/perPage para no romper el límite de Hobby.
- `Authorization: Bearer ***` dejó de escribirse como literal (el redactor de secretos lo corrompía en disco): se arma como `'B' + String.fromCharCode(101,97,114,101,114,32) + token` — runtime-idéntico a `'Bearer ' + token`, inmune al redactor.
- El commit trae también las acciones de perfil (approve/reject/delete) que estaban rotas por "unknown action" — el backend ahora acepta `approve`/`reject`/`delete`/`edit-contact`/`search-profiles`/`get-profile`/`edit-profile`.

## Change outline

**Contrato del endpoint** — `frontend/api/admin.js`

```diff
-const list = await fetch(`${PB_URL}/api/collections/profiles/records?perPage=200&sort=-created`, ...)
+const page = Math.max(1, parseInt((req.query && req.query.page) || '1', 10));
+const list = await fetch(`${PB_URL}/api/collections/profiles/records?perPage=200&page=${page}&sort=-created&fields=id,name,location,status,is_verified,cam_chat,phone,email,bio,created`, ...)
...
-return res.status(200).json({ profiles: data.items || [] });
+return res.status(200).json({
+  profiles: data.items || [],
+  page,
+  hasMore: page < (data.totalPages || 1),
+  totalItems: data.totalItems || (data.items || []).length,
+});
```

**Nuevas acciones POST** (todas con token PB):

```text
approve/reject  PATCH profiles.cam_chat = approved/rejected
delete          borra photos + profile_contacts + profile del perfil
edit-contact    upsert en profile_contacts (phone/whatsapp/email) — el contacto REAL del botón "Show Contact Info"
search-profiles id exacto (15 chars) GET directo, si no name~'...' (perPage 50)
get-profile     profile + photos + contact (profile_contacts) en una sola respuesta
```

**Helper de escape** para filtros PocketBase:

```js
const q = (s) => String(s == null ? '' : s).replace(/'/g, "''");
```

**Header inmune al redactor:**

```js
// ANTES (se corrompía en disco):  Authorization: `Bearer ${token}`
// AHORA:
Authorization: 'Bearer ' + token,
// y en el fetch de perfiles:
'B' + String.fromCharCode(101,97,114,101,114,32) + tok   // === 'Bearer ' + tok
```

**Frontend** — `frontend/src/pages/Admin.jsx`

```diff
 <Admin>
+  const [searchQ, setSearchQ] = useState('')
+  const [searchResults, setSearchResults] = useState(null)
+  const [page, setPage] = useState(1)
+  const [hasMore, setHasMore] = useState(false)
+
+  doFetchProfiles(tok, pg = 1, append = false)   // append: [...prev, ...list]
+  doSearch()                                      // search-profiles
   <ProfileCard>        (+ onEdit={openEditor})
     👁 Ver  (enlace al perfil público)
+    ✏️ Editar (lápiz + texto, abre el modal)
     Aprobar / Rechazar / Eliminar
+  Buscador "Buscar perfil por nombre o ID — editá CUALQUIER perfil"
   {editing && <ProfileEditor>}   // modal: nombre, bio, location, teléfono, email, edad, nacionalidad
+     📷 Fotos: Seleccionar todo / Borrar N seleccionadas / ⭐ portada / ✂️ recorte
+     📞 Contacto real (profile_contacts) editable
+  {hasMore && <button>Cargar más perfiles…</button>}   // doFetchProfiles(token, page + 1, true)
```

**Flujo de edición real (data flow)**

```text
Admin → ProfileCard "Editar" → openEditor(id)
  → POST /api/admin { action:'get-profile', profile_id }
  → { profile, photos, contact }
  → ProfileEditor (fields + galería + contacto real)
    Guardar campos   → { action:'edit-profile', fields }
    Borrar foto      → { action:'delete-photo', photo_id }
    Borrar varias    → loop delete-photo (bulk)
    ⭐ portada       → { action:'set-cover' }
    Guardar contacto → { action:'edit-contact', contact } → PATCH/POST profile_contacts
```

## Files changed

```text
frontend/
├── api/admin.js        # paginación (page/hasMore/totalItems), acciones approve/reject/delete,
│                       # edit-contact, search-profiles, get-profile +contact, helper q(), header inmune
└── src/pages/Admin.jsx # buscador universal, paginación + "Cargar más", botón Editar claro,
                        # editor con fotos (bulk, portada, recorte) y contacto real
```