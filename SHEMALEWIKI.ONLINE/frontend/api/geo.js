// Vercel Serverless Function: GET /api/geo
// Returns the visitor's country detected from Vercel's edge headers
// (x-vercel-ip-country) — zero latency, no browser permission prompt.
// Fallback chain: x-vercel-ip-country -> cf-ipcountry -> x-country -> null.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const country =
    req.headers['x-vercel-ip-country'] ||
    req.headers['cf-ipcountry'] ||
    req.headers['x-country'] ||
    null;

  // city/region available too (may be undefined)
  const city = req.headers['x-vercel-ip-city'] || null;

  return res.status(200).json({
    country: country ? String(country).toUpperCase() : null,
    city: city ? decodeURIComponent(String(city)) : null,
    source: country ? 'vercel-edge' : 'unknown',
  });
}
