// api/sitemap.js — sitemap.xml dinámico por marca: listado de rutas principales + perfiles aprobados.
// Cache en el edge (s-maxage). El host por request define el dominio del sitemap.
const PB = 'https://api.shemalewiki.online';

export default async function handler(req, res) {
  const h = req.headers || {};
  const hget = (k) => (typeof h.get === 'function' ? h.get(k) : h[k]);
  const host = hget('host') || 'shemalewiki.online';
  const isBT = String(host).includes('buscatrans');
  const base = `https://${host}`;

  const routes = isBT
    ? ['/', '/es/', '/es/europe', '/es/americas', '/es/asia', '/es/africa', '/es/oceania']
    : ['/', '/europe', '/americas', '/asia', '/africa', '/oceania'];

  const urls = routes.map((p) => ({ loc: p }));

  // perfiles aprobados: paginar toda la colección pública (cam_chat!='rejected' + approved)
  try {
    const seen = new Set();
    let page = 1;
    for (let guard = 0; guard < 25; guard++) {
      const r = await fetch(
        `${PB}/api/collections/profiles/records?perPage=500&page=${page}&fields=id,name&sort=created`,
        {}
      );
      if (!r.ok) break;
      const d = await r.json();
      for (const it of d.items || []) {
        if (!seen.has(it.id)) {
          seen.add(it.id);
          urls.push({ loc: `/profile/${it.id}` });
        }
      }
      if (page >= (d.totalPages || 1)) break;
      page++;
    }
  } catch (e) { /* sirve las rutas principales igual */ }

  const escapeXml = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${escapeXml(base + u.loc)}</loc></url>`).join('\n')}
</urlset>`;

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.end(body);
}

// Web-fetch fallback (edge/export)
export function GET(request) {
  return new Response('', { status: 200 });
}
