import axios from 'axios';

// This used to be an open proxy: any URL, TLS verification disabled, no limits.
// It only needs to serve the legacy external photo_url hosts that exist in the
// photos collection (sampled 2026-09-21: web.archive.org, www.kinky.nl,
// static2.eros.bz, plus a few duckduckgo image-proxy links). Everything else is
// refused, redirects are re-checked against the same list, and size/time are
// capped. Add a host here only if a real photo_url needs it.
const ALLOWED_HOST_SUFFIXES = ['archive.org', 'kinky.nl', 'eros.bz', 'duckduckgo.com'];
const MAX_BYTES = 8 * 1024 * 1024;

const isAllowedHost = (host) =>
  ALLOWED_HOST_SUFFIXES.some(sfx => host === sfx || host.endsWith('.' + sfx));

function parseAllowedUrl(raw) {
  let u;
  try { u = new URL(raw); } catch { return null; }
  if (u.protocol !== 'https:') return null;
  if (u.port && u.port !== '443') return null;
  if (u.username || u.password) return null;
  return isAllowedHost(u.hostname.toLowerCase()) ? u : null;
}

const FALLBACK_URL = 'https://placehold.co/300x400.png?text=No+Photo';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req.query;

  if (!url || typeof url !== 'string' || url.trim() === '') {
    return serveFallback(res);
  }

  const allowed = parseAllowedUrl(url.trim());
  if (!allowed) {
    return res.status(403).json({ error: 'Host not allowed' });
  }

  try {
    // Set request headers to look like a real browser and bypass hotlink protection
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      'Referer': allowed.origin,
    };

    const response = await axios.get(allowed.toString(), {
      responseType: 'arraybuffer',
      headers,
      timeout: 8000,
      maxContentLength: MAX_BYTES,
      maxBodyLength: MAX_BYTES,
      maxRedirects: 3,
      // archive.org answers with redirects; make sure none of them leaves the allowlist.
      beforeRedirect: (options) => {
        if (!isAllowedHost(String(options.hostname || '').toLowerCase())) {
          throw new Error('redirect to a host that is not allowed');
        }
      },
    });

    const contentType = response.headers['content-type'] || 'image/jpeg';

    // Only serve actual images. If archive.org returns HTML (404 page, redirect
    // page, soft-404) we must NOT forward it. Small JPEGs ARE valid photos
    // (thumbnails can be 1-3KB), so only reject non-image content-types and
    // files that are almost certainly the 1x1 transparent (68 bytes).
    const isImage = contentType.startsWith('image/');
    const dataBuf = Buffer.from(response.data);
    const isTinyTransparent = dataBuf.length <= 100; // 1x1 PNG is 68 bytes

    if (!isImage || isTinyTransparent) {
      return serveTransparent(res);
    }

    res.setHeader('Content-Type', contentType);
    // Cache the image for 1 day
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    return res.status(200).send(dataBuf);
  } catch (err) {
    console.error(`Image proxy failed for URL: ${url}. Error: ${err.message}`);
    return serveTransparent(res);
  }
};

// 1x1 transparent PNG — lets the frontend onload-check reject this profile photo
function serveTransparent(res) {
  const transparentPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64'
  );
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
  return res.status(200).send(transparentPng);
}

async function serveFallback(res) {
  try {
    const response = await axios.get(FALLBACK_URL, {
      responseType: 'arraybuffer',
      timeout: 6000
    });
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    return res.status(200).send(Buffer.from(response.data));
  } catch (err) {
    console.error('Fallback image fetch failed:', err.message);
    // Return a raw 1x1 transparent PNG if fallback is completely unreachable
    const transparentPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      'base64'
    );
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    return res.status(200).send(transparentPng);
  }
}
