// POST /api/auth/login
// Login de chicas/usuarios registrados
// Devuelve token JWT de PocketBase + userId

const PB_URL = process.env.PB_URL || 'https://api.shemalewiki.online';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });

  try {
    const authRes = await fetch(`${PB_URL}/api/collections/users/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: email, password }),
    });

    if (!authRes.ok) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const authData = await authRes.json();
    return res.status(200).json({
      token: authData.token,
      userId: authData.record.id,
      email: authData.record.email,
      name: authData.record.name,
    });
  } catch (e) {
    console.error('auth/login error:', e.message);
    return res.status(500).json({ error: 'Login failed.' });
  }
}
