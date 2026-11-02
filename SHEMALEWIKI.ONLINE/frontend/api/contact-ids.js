// GET /api/contact-ids?ids=a,b,c — para qué profile_ids existe contacto real
// (en profile_contacts). NO expone el valor del contacto: solo un boolean.
// Permite que el directorio muestre perfiles con contacto aunque no tengan
// foto (placeholder dorado), sin filtrar por la API pública (profile_contacts
// es privada: listRule = @request.auth.id != "").
import { pbFetch } from './pb-helper.js';

const PB_URL = 'https://api.shemalewiki.online';
const PB_ADMIN_EMAIL = 'admin@shemalewiki.online';
const PB_ADMIN_PASS = process.env.PB_ADMIN_PASS;
if (!PB_ADMIN_PASS) throw new Error('PB_ADMIN_PASS env var required');

// cache corta (30s) para no martillar PB en cada render
let cache = { at: 0, ids: new Set() };

async function getPBToken() {
  const res = await pbFetch(`${PB_URL}/api/admins/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: PB_ADMIN_EMAIL, password: PB_ADMIN_PASS }),
  });
  if (!res.ok) throw new Error(`PB auth failed: ${res.status}`);
  const d = await res.json();
  return d.token;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=30');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const ids = String(req.query.ids || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!ids.length) return res.status(400).json({ error: 'ids required' });
  // validar formato (ids de 15 chars alfanuméricos)
  if (ids.some(id => !/^[a-z0-9]{15}$/.test(id))) {
    return res.status(400).json({ error: 'invalid id' });
  }

  try {
    const now = Date.now();
    // refresh del cache cada 30s (cubre todo el directorio)
    if (now - cache.at > 30000) {
      const token = await getPBToken();
      const withContact = new Set();
      let page = 1;
      const PER = 500;
      for (;;) {
        const r = await pbFetch(
          `${PB_URL}/api/collections/profile_contacts/records?perPage=${PER}&page=${page}&fields=profile_id`);
        if (!r.ok) throw new Error(`PB list failed: ${r.status}`);
        const d = await r.json();
        for (const it of d.items || []) withContact.add(it.profile_id);
        if (page >= (d.totalPages || 1)) break;
        page += 1;
      }
      cache = { at: now, ids: withContact };
    }
    const result = {};
    for (const id of ids) result[id] = cache.ids.has(id);
    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ error: 'contact-ids error: ' + (e.message || e) });
  }
}