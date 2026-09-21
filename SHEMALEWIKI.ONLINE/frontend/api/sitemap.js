// GET /sitemap.xml  (vercel.json rewrites it here)
//
// Replaces the two static sitemaps, which were wrong in three ways:
//  - sitemap.xml listed 4,364 /profile/<x> URLs on shemalewiki.online using the LEGACY
//    `profiles.url` value (e.g. 2761, UUIDs) — the app resolves /profile/:id by PocketBase id,
//    so none of them opened a profile ("Perfil no encontrado" served with HTTP 200);
//  - buscatrans.com served the same file, so it listed 3 of its own URLs and 4,451 of another host's;
//  - sitemap-main.xml was frozen in May.
// This builds one sitemap per host from live data: only approved profiles that have a cover
// photo (the same rule the listings use), with the real ids, the countries/cities that
// actually have profiles, and the static pages.

const PB = 'https://api.shemalewiki.online';
const PER_PAGE = 500;
const MAX_URLS = 50000; // sitemap protocol limit

const BRANDS = {
  sw: {
    base: 'https://shemalewiki.online',
    prefix: '',
    pages: ['/', '/about', '/advertise', '/guide', '/harm-reduction', '/books', '/contact', '/register', '/launch', '/terms', '/privacy'],
  },
  bt: {
    base: 'https://buscatrans.com',
    prefix: '/es',
    pages: ['/es/', '/sobre-nosotros', '/anunciar', '/guia', '/guia-reduccion-danos', '/libros', '/contacto', '/registro', '/lanzamiento', '/terms', '/privacy'],
  },
};

const CONTINENTS = ['europe', 'americas', 'asia', 'oceania', 'africa'];

// Same slug rules as the app (Profile.jsx / ProfilesList.jsx)
const countrySlug = (c) => c.toLowerCase().replace(/\s+/g, '-');
const citySlug = (c) => c.toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[̀-ͯ]/g, '');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function pbJson(path) {
  const r = await fetch(`${PB}${path}`);
  if (!r.ok) throw new Error(`PocketBase ${r.status} for ${path.split('?')[0]}`);
  return r.json();
}

// Every record of a collection, fetching the remaining pages in parallel.
async function fetchAll(collection, query) {
  const url = (page) => `/api/collections/${collection}/records?perPage=${PER_PAGE}&page=${page}&${query}`;
  const first = await pbJson(url(1));
  const items = [...(first.items || [])];
  const pages = [];
  for (let p = 2; p <= (first.totalPages || 1); p++) pages.push(p);
  for (let i = 0; i < pages.length; i += 6) {
    const batch = await Promise.all(pages.slice(i, i + 6).map((p) => pbJson(url(p))));
    for (const b of batch) items.push(...(b.items || []));
  }
  return items;
}

export default async function handler(req, res) {
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').toLowerCase();
  const brand = host.includes('buscatrans') ? BRANDS.bt : BRANDS.sw;

  try {
    const [profiles, covers] = await Promise.all([
      fetchAll('profiles', 'sort=id&fields=id,location,updated'),
      fetchAll('photos', `sort=id&fields=profile_id&filter=${encodeURIComponent("(local_path='cover'&&file!='')")}`),
    ]);
    const hasCover = new Set(covers.map((c) => c.profile_id));

    const urls = [];
    const add = (path, lastmod, changefreq, priority) => {
      if (urls.length < MAX_URLS) urls.push({ loc: `${brand.base}${path}`, lastmod, changefreq, priority });
    };

    for (const p of brand.pages) add(p, undefined, p === '/' || p === '/es/' ? 'daily' : 'monthly', p === '/' || p === '/es/' ? '1.0' : '0.5');

    const countries = new Set();
    const cities = new Set();
    const shown = profiles.filter((p) => hasCover.has(p.id));
    for (const p of shown) {
      const parts = String(p.location || '').split(' | ').map((x) => x.trim());
      if (parts.length < 3) continue;
      const cont = parts[0].toLowerCase();
      const country = parts[parts.length - 2];
      const city = parts[parts.length - 1];
      if (!CONTINENTS.includes(cont) || !country || country === 'Unknown' || !city || city === 'Unknown') continue;
      countries.add(`${cont}/${countrySlug(country)}`);
      cities.add(`${cont}/${countrySlug(country)}/${citySlug(city)}`);
    }

    for (const c of CONTINENTS) add(`${brand.prefix}/${c}`, undefined, 'daily', '0.8');
    for (const c of [...countries].sort()) add(`${brand.prefix}/${c}`, undefined, 'daily', '0.7');
    for (const c of [...cities].sort()) add(`${brand.prefix}/${c}`, undefined, 'daily', '0.6');
    for (const p of shown) add(`${brand.prefix}/profile/${p.id}`, String(p.updated || '').slice(0, 10) || undefined, 'weekly', '0.5');

    const body = urls.map((u) =>
      `  <url><loc>${esc(u.loc)}</loc>` +
      (u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : '') +
      `<changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`
    ).join('\n');

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400');
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`);
  } catch (e) {
    console.error('sitemap error:', e.message);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).send('sitemap temporarily unavailable');
  }
}
