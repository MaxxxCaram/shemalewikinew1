// Vercel Serverless Function: POST /api/register
// Creates a new user (auth) + profile in PocketBase, linked via owner.
// Security: rate limiting + honeypot + CORS + input validation.
// Notification email sent to ads@shemalewiki.online via SMTP.

import nodemailer from 'nodemailer';

const PB_URL = process.env.PB_URL || 'https://api.shemalewiki.online';
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || 'admin@shemalewiki.online';
const PB_ADMIN_PASS = process.env.PB_ADMIN_PASS;
if (!PB_ADMIN_PASS) throw new Error('PB_ADMIN_PASS env var required');

// SMTP config — password ONLY from env, no fallback
const SMTP_HOST = 'smtp.hostinger.com';
const SMTP_PORT = 465;
const SMTP_USER = 'ads@shemalewiki.online';
const SMTP_PASS = process.env.ADS_EMAIL_PASSWORD;
const NOTIFY_EMAIL = 'ads@shemalewiki.online';

// Rate limiting: track IPs in-memory
const rateLimit = {};
const RATE_LIMIT_WINDOW = 3600000; // 1 hour
const RATE_LIMIT_MAX = 3;

const ALLOWED_ORIGINS = ['https://shemalewiki.online', 'https://buscatrans.com'];

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function isValidPhone(phone) {
  return /^\+?[\d\s\-()]{6,}$/.test(phone);
}

function sanitizeName(name) {
  return String(name).replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '').trim();
}

function isValidName(name) {
  const cleaned = sanitizeName(name);
  return cleaned.length >= 2 && cleaned.length <= 50 && cleaned === String(name).trim();
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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // CORS check
  const origin = req.headers.origin || '';
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({ error: 'Origin not allowed.' });
  }

  // Rate limit
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  if (!rateLimit[ip]) rateLimit[ip] = [];
  rateLimit[ip] = rateLimit[ip].filter(t => now - t < RATE_LIMIT_WINDOW);
  if (rateLimit[ip].length >= RATE_LIMIT_MAX) {
    return res.status(429).json({ error: 'Too many requests. Try again later.' });
  }
  rateLimit[ip].push(now);

  // Honeypot (invisible field that bots fill)
  if (req.body?.website_url) {
    return res.status(200).json({ success: true, profileId: 'ok' }); // silently accept but do nothing
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  const {
    name, email, password, phone, whatsapp, country, city, bio, age,
    languages, nationality, height, weight, endowment, onlyfans,
    services, availability,
  } = req.body || {};

  // ── Validation ──
  if (!name || !isValidName(name)) {
    return res.status(400).json({ error: 'Invalid name. Use 2-50 characters, letters only.' });
  }
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email.' });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }
  if (phone && !isValidPhone(phone)) {
    return res.status(400).json({ error: 'Invalid phone number.' });
  }

  try {
    // ── Create user (auth collection) ──
    const token = await getPBToken();
    const userRes = await fetch(`${PB_URL}/api/collections/users/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name,
        email,
        password,
        passwordConfirm: password,
      }),
    });
    const userData = await userRes.json();
    if (!userRes.ok) {
      const errMsg = userData.data?.email?.message || userData.message || 'Email already registered.';
      return res.status(400).json({ error: errMsg });
    }

    // ── Create profile with owner = user.id ──
    const parts = (country || 'Other') + ' | ' + (city || 'Unknown');
    const profileRes = await fetch(`${PB_URL}/api/collections/profiles/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name,
        owner: userData.id,
        bio: (bio || '').slice(0, 5000),
        description: (bio || '').slice(0, 5000),
        location: parts,
        age: String(age || ''),
        height: String(height || ''),
        weight: String(weight || ''),
        endowment: String(endowment || ''),
        nationality: nationality || '',
        languages: languages || '',
        phone: phone || '',
        whatsapp: whatsapp || '',
        email: email || '',
        onlyfans: onlyfans || '',
        status: 'pending',
        is_verified: 'no',
      }),
    });
    const profileData = await profileRes.json();
    if (!profileRes.ok) {
      throw new Error(profileData.message || 'Failed to create profile.');
    }

    // ── Save services if provided ──
    if (services) {
      const serviceList = String(services).split(',').map(s => s.trim()).filter(Boolean);
      for (const svc of serviceList) {
        await fetch(`${PB_URL}/api/collections/services/records`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ profile_id: profileData.id, service_name: svc, available: 'yes' }),
        });
      }
    }

    // ── Send notification email (best effort) ──
    if (SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: SMTP_HOST, port: SMTP_PORT,
          auth: { user: SMTP_USER, pass: SMTP_PASS },
        });
        await transporter.sendMail({
          from: SMTP_USER,
          to: NOTIFY_EMAIL,
          subject: `New profile registration: ${name}`,
          html: `<p><strong>${name}</strong> (${email}) registered a new profile.</p>
                 <p>Location: ${parts}</p>
                 <p>Profile ID: ${profileData.id}</p>
                 <p>Remember to approve this profile and set the cover photo.</p>`,
        });
      } catch { /* notification is best-effort */ }
    }

    return res.status(200).json({
      success: true,
      profileId: profileData.id,
      userId: userData.id,
      message: 'Profile registered. Pending review.',
    });

  } catch (e) {
    console.error('register error:', e.message);
    return res.status(500).json({ error: e.message || 'Internal error during registration.' });
  }
}
