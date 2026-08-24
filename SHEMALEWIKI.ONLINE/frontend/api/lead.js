// /api/lead — capture launch leads (email / whatsapp) into Supabase Storage
// Storage bucket: vivas-data/leads/{timestamp}.json

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qtuzpswxzengqoqqwtpt.supabase.co';

function getServiceKey() {
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_KEY not set');
  return key;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, whatsapp, name, source = 'launch', role = 'client' } = req.body || {};
    if (!email && !whatsapp) {
      return res.status(400).json({ error: 'Email or WhatsApp required' });
    }

    // Validate email if present
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    // Validate whatsapp if present (7-20 digits)
    if (whatsapp && whatsapp.replace(/\D/g, '').length < 7) {
      return res.status(400).json({ error: 'Invalid WhatsApp number' });
    }

    const serviceKey = getServiceKey();
    const ts = Date.now();
    const lead = {
      ts: new Date().toISOString(),
      name: String(name || '').trim().slice(0, 100),
      email: email ? String(email).trim().toLowerCase().slice(0, 200) : '',
      whatsapp: whatsapp ? String(whatsapp).trim().slice(0, 30) : '',
      role,
      source,
    };

    const path = `leads/${ts}_${Math.random().toString(36).slice(2, 8)}.json`;
    const body = JSON.stringify(lead);

    const storageRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/vivas-data/${path}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey,
          'Content-Type': 'application/json',
          'x-upsert': 'true',
        },
        body,
      }
    );

    if (!storageRes.ok) {
      const errText = await storageRes.text();
      console.error('Storage lead write failed:', storageRes.status, errText);
      return res.status(502).json({ error: 'Could not store lead' });
    }

    return res.status(200).json({ success: true, stored: path });
  } catch (err) {
    console.error('Lead capture error:', err.message);
    return res.status(500).json({ error: 'Internal error' });
  }
}
