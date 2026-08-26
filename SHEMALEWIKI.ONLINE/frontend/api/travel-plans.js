// Travel plans endpoint — active travelers for a city.
// Returns an empty list (feature not yet populated). Exists so the frontend
// fetch to /api/travel-plans/active doesn't 404 / throw a CORS error.
export default function handler(req, res) {
  const origin = req.headers.origin;
  // Allow the site's own origins (www + apex on both domains).
  if (origin && /shemalewiki\.online|buscatrans\.com/.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const city = req.query.city || '';
  res.status(200).json({ city, active: [] });
}