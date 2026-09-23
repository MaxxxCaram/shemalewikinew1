// Vercel Serverless Function: POST /api/admin
// Admin panel — login as PocketBase superuser, then approve/reject claims.
// Routes: POST { action: 'login', password } → { token }
//         POST { action: 'list-claims' } → { claims }
//         POST { action: 'approve-claim', claim_id } → { profile_id, owner }
//         POST { action: 'reject-claim', claim_id } → { ok }

const PB_URL = process.env.PB_URL || 'https://api.shemalewiki.online';
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || 'admin@shemalewiki.online';
const PB_ADMIN_PASS = process.env.PB_ADMIN_PASS;
if (!PB_ADMIN_PASS) throw new Error('PB_ADMIN_PASS env var required.');

const ALLOWED_ORIGINS = ['https://www.shemalewiki.online', 'https://shemalewiki.online', 'https://buscatrans.com'];

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    // Listar perfiles (token requerido) — compat con Admin.jsx que hace GET tras login
    const authHeader2 = req.headers.authorization || '';
    if (!authHeader2.startsWith('Bearer ')) return res.status(401).json({ error: 'Token required.' });
    const vres = await fetch(`${PB_URL}/api/admins/auth-with-password`, { method: 'POST' });
    // validar token contra PB: usar endpoint de PB /api/admins/auth-refresh no existe para tokens JWT genericos;
    // en su lugar, decodificar payload y verificar expiracion (mismo esquema que PB: JWT HS256)
    try {
      const payload = JSON.parse(Buffer.from(authHeader2.split('.')[1], 'base64').toString());
      if (!payload.id || !payload.exp || payload.exp * 1000 < Date.now()) {
        return res.status(401).json({ error: 'Invalid token.' });
      }
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    const page = Math.max(1, parseInt((req.query && req.query.page) || '1', 10));
    const list = await fetch(`${PB_URL}/api/collections/profiles/records?perPage=200&page=${page}&sort=-created&fields=id,name,location,status,is_verified,cam_chat,phone,email,bio,created`, {
      headers: { Authorization: `Bearer ${authHeader2.substring(7)}` },
    });
    if (!list.ok) return res.status(401).json({ error: 'Invalid token.' });
    const data = await list.json();
    return res.status(200).json({
      profiles: data.items || [],
      page,
      hasMore: page < (data.totalPages || 1),
      totalItems: data.totalItems || (data.items || []).length,
    });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  // ── Multipart: upload cropped photo (reemplaza file de una foto existente) ──
  const ctype = req.headers['content-type'] || '';
  if (ctype.includes('multipart/form-data')) {
    try {
      const bb = (await import('@vercel/functions')).default;
    } catch { /* fallback manual below */ }
    try {
      const formidable = null;
      // parse manual del multipart con req.body ya buffered (Vercel lo bufferiza como stream)
      const chunks = [];
      for await (const ch of req) chunks.push(ch);
      const buf = Buffer.concat(chunks);
      const m = buf.toString('binary').match(/--(----H[0-9a-f]+)\r\n/);
      const boundary = m ? m[1] : req.headers['content-type'].split('boundary=')[1];
      // extraer campos y archivo del multipart
      const parts = buf.toString('binary').split('--' + boundary);
      let photo_id = null, token = null, fileBuf = null, filename = 'crop.jpg';
      for (const part of parts) {
        if (part.includes('name="photo_id"')) {
          photo_id = part.split('\r\n\r\n')[1]?.split('\r\n')[0];
        } else if (part.includes('name="token"')) {
          token = part.split('\r\n\r\n')[1]?.split('\r\n')[0];
        } else if (part.includes('filename="')) {
          const hEnd = part.indexOf('\r\n\r\n');
          filename = (part.match(/filename="([^"]+)"/) || [,'crop.jpg'])[1];
          fileBuf = Buffer.from(part.slice(hEnd + 4).replace(/\r\n--$/, ''), 'binary');
        }
      }
      if (!photo_id || !token || !fileBuf) {
        return res.status(400).json({ error: 'photo_id, token y file requeridos.' });
      }
      // auth: validar token como superuser
      const auth = await fetch(`${PB_URL}/api/admins/auth-refresh`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (!auth.ok) return res.status(401).json({ error: 'Token invalido.' });
      // subir archivo reemplazando el file del record existente
      const b2 = '----X' + Math.random().toString(16).slice(2);
      const fd = `--${b2}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: image/jpeg\r\n\r\n`;
      const body2 = Buffer.concat([Buffer.from(fd, 'binary'), fileBuf, Buffer.from(`\r\n--${b2}--\r\n`)]);
      const up = await fetch(`${PB_URL}/api/collections/photos/records/${photo_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': `multipart/form-data; boundary=${b2}`, Authorization: `Bearer ${token}` },
        body: body2,
      });
      if (!up.ok) {
        const t = await up.text();
        return res.status(500).json({ error: 'Failed to replace photo: ' + t.slice(0, 120) });
      }
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: 'upload-photo error: ' + e.message });
    }
  }

  const { action, password, token: tokenBody, claim_id } = req.body || {};
  // El Admin.jsx manda el token en el header Authorization; aceptar ambos
  const token = tokenBody || (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  // Compat: el Admin.jsx envia {secret} en vez de {action:'login', password}
  let _action = action, _password = password;
  if (!action && req.body && typeof req.body.secret === 'string') { _action = 'login'; _password = req.body.secret; }

  try {
    // ── Login: authenticate as PB superuser, return token ──
    if (_action === 'login') {
      if (!_password) return res.status(400).json({ error: 'Password required.' });
      const res2 = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity: PB_ADMIN_EMAIL, password: _password || PB_ADMIN_PASS }),
      });
      if (!res2.ok) return res.status(401).json({ error: 'Invalid admin password.' });
      const d = await res2.json();
      return res.status(200).json({ token: d.token });
    }

    // ── All other actions require a valid PB token ──
    if (!token) return res.status(401).json({ error: 'Token required.' });
    const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    // ── List claims (expand profile + claimant_user so the panel has names/contact without extra calls) ──
    if (action === 'list-claims') {
      const r = await fetch(`${PB_URL}/api/collections/claims/records?perPage=100&sort=-created&expand=profile,claimant_user`, {
        headers: authHeaders,
      });
      if (!r.ok) throw new Error('Failed to list claims.');
      const d = await r.json();
      return res.status(200).json({ claims: d.items || [] });
    }


    // ── Get one profile with photos (for editor) ──
    if (action === 'get-profile') {
      const pid = req.body.profile_id;
      if (!pid) return res.status(400).json({ error: 'profile_id required.' });
      const rP = await fetch(`${PB_URL}/api/collections/profiles/records/${pid}`, { headers: authHeaders });
      if (!rP.ok) return res.status(404).json({ error: 'Profile not found.' });
      const profile = await rP.json();
      const rF = await fetch(`${PB_URL}/api/collections/photos/records?filter=(profile_id='${pid}')&perPage=500&sort=-created`, { headers: authHeaders });
      const photos = rF.ok ? (await rF.json()).items || [] : [];
      return res.status(200).json({ profile, photos });
    }

    // ── Edit profile fields (admin edit) ──
    if (action === 'edit-profile') {
      const pid = req.body.profile_id;
      const fields = req.body.fields || {};
      if (!pid) return res.status(400).json({ error: 'profile_id required.' });
      // whitelist de campos editables
      const allowed = ['name','bio','description','location','phone','whatsapp','email','age','height','weight','nationality','languages','endowment','onlyfans','status','cam_chat'];
      const body = {};
      for (const k of allowed) if (k in fields) body[k] = fields[k];
      const r = await fetch(`${PB_URL}/api/collections/profiles/records/${pid}`, {
        method: 'PATCH', headers: authHeaders, body: JSON.stringify(body),
      });
      if (!r.ok) return res.status(500).json({ error: 'Failed to update profile.' });
      return res.status(200).json({ ok: true });
    }

    // ── Delete one photo ──
    if (action === 'delete-photo') {
      const photo_id = req.body.photo_id;
      if (!photo_id) return res.status(400).json({ error: 'photo_id required.' });
      const r = await fetch(`${PB_URL}/api/collections/photos/records/${photo_id}`, {
        method: 'DELETE', headers: authHeaders,
      });
      if (!r.ok && r.status !== 404) return res.status(500).json({ error: 'Failed to delete photo.' });
      return res.status(200).json({ ok: true });
    }

    // ── Set cover: quitar cover vieja del perfil, marcar esta ──
    if (action === 'set-cover') {
      const { photo_id, profile_id } = req.body;
      if (!photo_id || !profile_id) return res.status(400).json({ error: 'photo_id + profile_id required.' });
      // limpiar covers viejas
      const rList = await fetch(`${PB_URL}/api/collections/photos/records?filter=(profile_id='${profile_id}'&&local_path='cover')&perPage=500`, { headers: authHeaders });
      if (rList.ok) {
        for (const ph of ((await rList.json()).items || [])) {
          if (ph.id !== photo_id) {
            await fetch(`${PB_URL}/api/collections/photos/records/${ph.id}`, {
              method: 'PATCH', headers: authHeaders, body: JSON.stringify({ local_path: '' }),
            });
          }
        }
      }
      const r = await fetch(`${PB_URL}/api/collections/photos/records/${photo_id}`, {
        method: 'PATCH', headers: authHeaders, body: JSON.stringify({ local_path: 'cover' }),
      });
      if (!r.ok) return res.status(500).json({ error: 'Failed to set cover.' });
      return res.status(200).json({ ok: true });
    }

    // ── Upload cropped photo (reemplaza o crea) ──
    if (action === 'upload-photo') {
      // multipart: se maneja fuera de este branch JSON — ver handler multipart abajo
    }

    // ── Aprobar / rechazar perfil (cam_chat) ──
    if (action === 'approve' || action === 'reject') {
      const pid = req.body.profile_id;
      if (!pid) return res.status(400).json({ error: 'profile_id required.' });
      const r = await fetch(`${PB_URL}/api/collections/profiles/records/${pid}`, {
        method: 'PATCH', headers: authHeaders,
        body: JSON.stringify({ cam_chat: action === 'approve' ? 'approved' : 'rejected' }),
      });
      if (!r.ok) return res.status(500).json({ error: 'Failed to update profile.' });
      return res.status(200).json({ ok: true });
    }

    // ── Eliminar perfil + fotos + contactos ──
    if (action === 'delete') {
      const pid = req.body.profile_id;
      if (!pid) return res.status(400).json({ error: 'profile_id required.' });
      const rF = await fetch(`${PB_URL}/api/collections/photos/records?filter=(profile_id='${pid}')&perPage=500`, { headers: authHeaders });
      if (rF.ok) {
        for (const ph of ((await rF.json()).items || [])) {
          await fetch(`${PB_URL}/api/collections/photos/records/${ph.id}`, { method: 'DELETE', headers: authHeaders });
        }
      }
      const rC = await fetch(`${PB_URL}/api/collections/profile_contacts/records?filter=(profile_id='${pid}')&perPage=500`, { headers: authHeaders });
      if (rC.ok) {
        for (const c of ((await rC.json()).items || [])) {
          await fetch(`${PB_URL}/api/collections/profile_contacts/records/${c.id}`, { method: 'DELETE', headers: authHeaders });
        }
      }
      const r = await fetch(`${PB_URL}/api/collections/profiles/records/${pid}`, { method: 'DELETE', headers: authHeaders });
      if (!r.ok && r.status !== 404) return res.status(500).json({ error: 'Failed to delete profile.' });
      return res.status(200).json({ ok: true });
    }

    // ── Buscar perfiles: editar CUALQUIER perfil (por id o nombre) ──
    if (action === 'search-profiles') {
      const q = String(req.body.q || '').trim();
      if (!q) return res.status(400).json({ error: 'q required.' });
      let items = [];
      if (/^[a-z0-9]{15}$/.test(q)) {
        const rP = await fetch(`${PB_URL}/api/collections/profiles/records/${q}`, { headers: authHeaders });
        if (rP.ok) items = [await rP.json()];
      }
      if (items.length === 0) {
        const r = await fetch(`${PB_URL}/api/collections/profiles/records?filter=name~'${q.replace(/'/g, '')}'&perPage=50&sort=-created`, { headers: authHeaders });
        if (r.ok) items = (await r.json()).items || [];
      }
      return res.status(200).json({ profiles: items });
    }

    // ── Approve claim: set profiles.owner = claimant_user, mark approved ──
    if (action === 'approve-claim') {
      if (!claim_id) return res.status(400).json({ error: 'claim_id required.' });
      // get claim
      const rClaim = await fetch(`${PB_URL}/api/collections/claims/records/${claim_id}`, { headers: authHeaders });
      const claim = await rClaim.json();
      if (!rClaim.ok) throw new Error('Claim not found.');

      // update profile: set owner and approve
      const rUpdate = await fetch(`${PB_URL}/api/collections/profiles/records/${claim.profile}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ owner: claim.claimant_user, status: 'approved' }),
      });
      if (!rUpdate.ok) throw new Error('Failed to update profile owner.');

      // El contacto que la chica cargó al reclamar vive como texto libre en
      // claim.evidence (api/register.js lo arma como "Nombre: ..\nEmail: ..
      // \nTel: ..\nWhatsApp: .."). Lo parseamos y lo volcamos a
      // profile_contacts recién ahora que un admin aprobó — antes de esto
      // el perfil público no debe mostrar ningún contacto nuevo.
      const pick = (label) => {
        const m = String(claim.evidence || '').match(new RegExp(`${label}:\\s*(.+)`));
        const v = m ? m[1].trim() : '';
        return v && v !== '-' ? v : '';
      };
      const contactBody = { profile_id: claim.profile };
      const phone = pick('Tel');
      const whatsapp = pick('WhatsApp');
      const email = pick('Email');
      if (phone) contactBody.phone = phone;
      if (whatsapp) contactBody.whatsapp = whatsapp;
      if (email) contactBody.email = email;
      if (phone || whatsapp || email) {
        try {
          await fetch(`${PB_URL}/api/collections/profile_contacts/records`, {
            method: 'POST', headers: authHeaders, body: JSON.stringify(contactBody),
          });
        } catch (e) { console.error('approve-claim: profile_contacts upsert failed', e.message); }
      }

      // mark claim approved (need superuser to bypass the lock — we ARE superuser)
      const rClaimUpdate = await fetch(`${PB_URL}/api/collections/claims/records/${claim_id}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ status: 'approved' }),
      });
      if (!rClaimUpdate.ok) throw new Error('Failed to update claim status.');

      return res.status(200).json({ profile_id: claim.profile, owner: claim.claimant_user });
    }

    // ── Reject claim ──
    if (action === 'reject-claim') {
      if (!claim_id) return res.status(400).json({ error: 'claim_id required.' });
      const r = await fetch(`${PB_URL}/api/collections/claims/records/${claim_id}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ status: 'rejected' }),
      });
      if (!r.ok) throw new Error('Failed to reject claim.');
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Unknown action.' });

  } catch (e) {
    console.error('admin error:', e.message);
    return res.status(500).json({ error: e.message || 'Internal error.' });
  }
}
