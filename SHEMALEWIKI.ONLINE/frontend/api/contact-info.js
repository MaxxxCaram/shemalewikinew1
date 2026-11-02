// Vercel Serverless Function: GET /api/contact-info?profile_id=xxx
// Serves PII (phone/whatsapp/email) from the protected profile_contacts
// collection, with basic rate-limiting per IP. The data itself is no longer
// exposed in the public profiles API.
const PB_URL = process.env.PB_URL || 'https://api.shemalewiki.online';
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || 'admin@shemalewiki.online';
const PB_ADMIN_PASS = process.env.PB_ADMIN_PASS;
if (!PB_ADMIN_PASS) throw new Error('PB_ADMIN_PASS env var required');

// cache del set de profile_ids con contacto (refrescar cada 60s, no repaginar en cada chunk)
let contactCache = { at: 0, ids: null };
async function getAllContactIds() {
  const now = Date.now();
  if (contactCache.ids && (now - contactCache.at) < 60000) return contactCache.ids;
  const withContact = new Set();
  const token = await getPBToken();
  let page = 1;
  const PER = 500;
  for (;;) {
    const rr = await pbFetch(
      `/api/collections/profile_contacts/records?perPage=${PER}&page=${page}&fields=profile_id`,
      { headers: { Authorization: 'Bearer ' + token } }
    );
    if (!rr.ok) throw new Error(`PB list: ${rr.status}`);
    const dd = await rr.json();
    for (const it of dd.items || []) withContact.add(it.profile_id);
    if (page >= (dd.totalPages || 1)) break;
    page += 1;
  }
  contactCache = { at: now, ids: withContact };
  return withContact;
}

// simple in-memory rate limiter (per IP, 60 req/min — el batch puede disparar varios chunks)
const rateMap = {};
function rateLimited(ip) {
  const now = Date.now();
  const windowMs = 60000;
  if (!rateMap[ip]) rateMap[ip] = [];
  rateMap[ip] = rateMap[ip].filter(t => now - t < windowMs);
  if (rateMap[ip].length >= 10) return true;
  rateMap[ip].push(now);
  return false;
}

async function getPBToken() {
  const res = await pbFetch(`/api/admins/auth-with-password`, {
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
  if (req.method === 'OPTIONS') return res.status(200).end();

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (rateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests. Try again in a minute.' });
  }

  // Modo batch: ?ids=a,b,c → qué profile_ids tienen contacto (true/false).
  // NO expone el valor del contacto: solo marca quién lo tiene, para que el
  // directorio liste perfiles con contacto aunque no tengan foto.
  const { profile_id, ids } = req.query;
  if (ids) {
    try {
      const idList = String(ids).split(',').map(s => s.trim()).filter(Boolean);
      if (idList.some(id => !/^[a-z0-9]{15}$/.test(id))) {
        return res.status(400).json({ error: 'invalid id' });
      }
      const withContact = await getAllContactIds();
      const result = {};
      for (const id of idList) result[id] = withContact.has(id);
      return res.status(200).json(result);
    } catch (e) {
      return res.status(500).json({ error: e.message || 'Internal error.' });
    }
  }

  if (!profile_id || !/^[a-z0-9]{15}$/.test(profile_id)) {
    return res.status(400).json({ error: 'Missing or invalid profile_id.' });
  }

  try {
    const token = await getPBToken();
    const r = await pbFetch(`/api/collections/profile_contacts/records?perPage=1&filter=${encodeURIComponent(`profile_id='${profile_id}'`)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!r.ok) throw new Error(`PB fetch: ${r.status}`);
    const d = await r.json();
    const item = d.items?.[0];
    if (!item) return res.status(404).json({ error: 'No contact info for this profile.' });

    return res.status(200).json({
      phone: item.phone || '',
      whatsapp: item.whatsapp || '',
      email: item.email || '',
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Internal error.' });
  }
}
