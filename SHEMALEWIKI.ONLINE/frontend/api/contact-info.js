// Vercel Serverless Function: GET /api/contact-info?profile_id=xxx
// Serves PII (phone/whatsapp/email) from the protected profile_contacts
// collection, with basic rate-limiting per IP. The data itself is no longer
// exposed in the public profiles API.
const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8080';
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || 'admin@shemalewiki.online';
const PB_ADMIN_PASS = process.env.PB_ADMIN_PASS || '';

// simple in-memory rate limiter (per IP, 10 req/min)
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
  const res = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
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

  const { profile_id } = req.query;
  if (!profile_id || !/^[a-z0-9]{15}$/.test(profile_id)) {
    return res.status(400).json({ error: 'Missing or invalid profile_id.' });
  }

  try {
    const token = await getPBToken();
    const r = await fetch(
      `${PB_URL}/api/collections/profile_contacts/records?perPage=1&filter=${encodeURIComponent(`profile_id='${profile_id}'`)}`,
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
