// Vercel Serverless Function: POST /api/admin
// Admin panel — login as PocketBase superuser, then approve/reject claims.
// Routes: POST { action: 'login', password } → { token }
//         POST { action: 'list-claims' } → { claims }
//         POST { action: 'approve-claim', claim_id } → { profile_id, owner }
//         POST { action: 'reject-claim', claim_id } → { ok }

const PB_URL = process.env.PB_URL || 'https://api.shemalewiki.online';
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || 'admin@shemalewiki.online';
const PB_ADMIN_PASS = process.env.PB_ADMIN_PASS || 'Admin-PocketBase-2026!';

const ALLOWED_ORIGINS = ['https://shemalewiki.online', 'https://buscatrans.com'];

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  const { action, password, token, claim_id } = req.body || {};

  try {
    // ── Login: authenticate as PB superuser, return token ──
    if (action === 'login') {
      if (!password) return res.status(400).json({ error: 'Password required.' });
      const res2 = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity: PB_ADMIN_EMAIL, password: password || PB_ADMIN_PASS }),
      });
      if (!res2.ok) return res.status(401).json({ error: 'Invalid admin password.' });
      const d = await res2.json();
      return res.status(200).json({ token: d.token });
    }

    // ── All other actions require a valid PB token ──
    if (!token) return res.status(401).json({ error: 'Token required.' });
    const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    // ── List pending claims ──
    if (action === 'list-claims') {
      const r = await fetch(`${PB_URL}/api/collections/claims/records?perPage=100&sort=-created`, {
        headers: authHeaders,
      });
      if (!r.ok) throw new Error('Failed to list claims.');
      const d = await r.json();
      return res.status(200).json({ claims: d.items || [] });
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
