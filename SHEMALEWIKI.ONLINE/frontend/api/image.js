import axios from 'axios';
import https from 'https';

// Cierre de seguridad (auditoría 2026-09-21):
// - el proxy estaba abierto (CORS *, sin allowlist, rejectUnauthorized: false).
// - Las únicas imágenes legítimas del sitio viven en api.shemalewiki.online
//   (se sirven por /api/img?u=...). Las photo_url externas que quedan
//   (web.archive.org, kinky.nl, eros, duckduckgo) están prohibidas/muertas
//   por regla de producto — no deben servirse.
const ALLOWED_ORIGINS = ['https://www.shemalewiki.online', 'https://shemalewiki.online', 'https://buscatrans.com'];
const ALLOWED_HOSTS = ['api.shemalewiki.online'];

const rate = {}; // ip -> {n, at}
const RATE_WINDOW = 3600000; // 1h
const RATE_MAX = 60;

function rateLimited(ip) {
  const now = Date.now();
  const r = rate[ip];
  if (!r || (now - r.at) > RATE_WINDOW) {
    rate[ip] = { n: 1, at: now };
    return false;
  }
  r.n += 1;
  return r.n > RATE_MAX;
}

const transparentPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
);

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || '?';
  if (rateLimited(ip)) return res.status(429).json({ error: 'Too many requests.' });

  const { url } = req.query;
  if (!url || url.trim() === '') return serveTransparent(res);

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return res.status(403).json({ error: 'forbidden' });
  }
  // allowlist estricto: solo el host de las fotos reales
  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    return res.status(403).json({ error: 'forbidden host' });
  }
  if (!parsed.pathname.startsWith('/api/files/')) {
    return res.status(403).json({ error: 'forbidden path' });
  }

  try {
    const httpsAgent = new https.Agent({ rejectUnauthorized: true });
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      'Referer': parsed.origin,
    };
    const response = await axios.get(url, { responseType: 'arraybuffer', httpsAgent, headers, timeout: 8000 });
    const contentType = response.headers['content-type'] || 'image/jpeg';
    const dataBuf = Buffer.from(response.data);
    const isImage = contentType.startsWith('image/');
    if (!isImage || dataBuf.length <= 100) return serveTransparent(res);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    return res.status(200).send(dataBuf);
  } catch (err) {
    console.error(`Image proxy failed for URL: ${url}. Error: ${err.message}`);
    return serveTransparent(res);
  }
}

function serveTransparent(res) {
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
  return res.status(200).send(transparentPng);
}
