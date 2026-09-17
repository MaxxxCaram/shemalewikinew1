// api/img.js — Edge proxy con caché para las fotos de PocketBase.
//
// Objetivo: que el VPS (Hostinger) deje de servir cada foto. Las fotos se
// piden a este endpoint del mismo dominio, Vercel las cachea en su CDN
// (s-maxage 1 año) y el VPS sólo recibe el primer MISS.
//
// Seguridad: sólo permite el host de PocketBase y rutas /api/files/ (no es
// un proxy abierto).
export const config = { runtime: 'edge' };

const ALLOWED_HOST = 'api.shemalewiki.online';
const ONE_YEAR = 60 * 60 * 24 * 365;

export default async function handler(req) {
  const target = new URL(req.url).searchParams.get('u');
  if (!target) return new Response('missing u', { status: 400 });

  let url;
  try {
    url = new URL(target);
  } catch {
    return new Response('bad url', { status: 400 });
  }
  if (url.host !== ALLOWED_HOST || !url.pathname.startsWith('/api/files/')) {
    return new Response('forbidden', { status: 403 });
  }

  let upstream;
  try {
    upstream = await fetch(url.toString(), {
      headers: { 'user-agent': 'ShemaleWiki-ImgProxy/1.0' },
      cf: { cacheTtl: ONE_YEAR },
    });
  } catch (e) {
    return new Response('upstream error', { status: 502 });
  }

  if (!upstream.ok) {
    return new Response(`upstream ${upstream.status}`, { status: upstream.status });
  }

  const body = await upstream.arrayBuffer();
  return new Response(body, {
    status: 200,
    headers: {
      'content-type': upstream.headers.get('content-type') || 'image/jpeg',
      // Cache-Control para el navegador + CDN. stale-while-revalidate evita
      // que el usuario espere si la entrada expira.
      'cache-control': `public, max-age=2592000, s-maxage=${ONE_YEAR}, stale-while-revalidate=86400, immutable`,
      'access-control-allow-origin': '*',
      'x-sw-proxy': '1',
    },
  });
}
