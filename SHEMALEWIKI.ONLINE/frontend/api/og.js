// api/og.js — server-rendered head tags for /profile/<id> (crawler previews + SEO).
//
// The Vercel rewrite routes /profile/* here. We resolve name + cover from
// PocketBase and inject the tags into the app shell. The shell comes from the
// lambda bundle (vercel.json: functions.api/og.js.includeFiles = dist/index*.html)
// because a function fetching its own origin deadlocks inside Vercel.
//
// One function serves both brands: shemalewiki.online uses dist/index.html and
// buscatrans.com uses dist/index-bt.html (chosen from the Host header), so a profile
// on buscatrans.com no longer declares a shemalewiki canonical / site name.
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PB = 'https://api.shemalewiki.online';

const BRANDS = {
  sw: {
    name: 'ShemaleWiki',
    siteName: 'ShemaleWiki',
    shell: 'index.html',
    base: 'https://shemalewiki.online',
    locale: 'en_US',
    og: {
      title: 'ShemaleWiki Online — Trans Companion Directory',
      desc: "The world's premier multilingual directory of trans companions. Browse profiles by country and city.",
      image: 'https://shemalewiki.online/logosw.png',
      imageW: '512',
      imageH: '512',
    },
    profileDesc: (name, location) => (location ? `${name} — ${location}` : `Profile of ${name} on ShemaleWiki`),
  },
  bt: {
    name: 'BuscaTrans',
    siteName: 'BuscaTrans',
    shell: 'index-bt.html',
    base: 'https://buscatrans.com',
    locale: 'es_ES',
    og: {
      title: 'BuscaTrans — Comunidad de Acompañantes Trans',
      desc: 'BuscaTrans — directorio gratuito de acompañantes trans en español. Explorá perfiles por continente, país y ciudad.',
      image: 'https://buscatrans.com/logos/buscatrans-new-logo.jpg',
      imageW: '1024',
      imageH: '1024',
    },
    profileDesc: (name, location) => (location ? `${name} — ${location}` : `Perfil de ${name} en BuscaTrans`),
  },
};

// Photos collection id (stable). Used as fallback for the file URL.
const PHOTOS_COLLECTION = 'u4i29ndk3g7bsv5';

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const q = (s) => s.replace(/'/g, "''");

function parseProfileId(pathname) {
  // /profile/abc123, /es/profile/abc123, /pt/profile/<legacy-uuid> ...
  const m = pathname.match(/^(\/[a-z]{2})?\/profile\/([A-Za-z0-9-]+)\/?$/);
  return m ? { id: m[2], prefix: m[1] || '' } : null;
}

// Returns { status: 'ok', ... } | { status: 'moved', id } | { status: 'missing' } | { status: 'error' }.
// `error` means PocketBase did not answer properly: never turn that into a 404.
async function getProfileData(brand, profileId) {
  const cover = (id) => fetch(`${PB}/api/collections/photos/records?perPage=1&sort=-created&fields=id,file,collectionId&filter=${encodeURIComponent(`(profile_id='${q(id)}')&&(local_path='cover')&&(file!='')`)}`);
  const byId = await fetch(`${PB}/api/collections/profiles/records?perPage=1&fields=id,name,location&filter=${encodeURIComponent(`(id='${q(profileId)}')&&(cam_chat!='rejected')`)}`);
  if (!byId.ok) return { status: 'error' };
  const profile = ((await byId.json()).items || [])[0];

  if (!profile) {
    // The old sitemaps (and old links) used the legacy `profiles.url` value as the id.
    const byUrl = await fetch(`${PB}/api/collections/profiles/records?perPage=1&fields=id&filter=${encodeURIComponent(`(url='${q(profileId)}')&&(cam_chat!='rejected')`)}`);
    if (!byUrl.ok) return { status: 'error' };
    const legacy = ((await byUrl.json()).items || [])[0];
    return legacy ? { status: 'moved', id: legacy.id } : { status: 'missing' };
  }

  let image = brand.og.image;
  let hasPhoto = false;
  const photoRes = await cover(profile.id);
  if (photoRes.ok) {
    const ph = ((await photoRes.json()).items || [])[0];
    if (ph && ph.file) {
      const collection = ph.collectionId || PHOTOS_COLLECTION;
      image = `${PB}/api/files/${collection}/${ph.id}/${encodeURIComponent(ph.file)}`;
      hasPhoto = true;
    }
  }
  return { status: 'ok', name: profile.name || profileId, location: profile.location || '', image, hasPhoto };
}

const shellMemo = {};
function getShell(brand) {
  if (shellMemo[brand.shell]) return shellMemo[brand.shell];
  // The shell is bundled into the lambda via vercel.json functions.includeFiles
  // (self-fetching the site inside a function deadlocks in Vercel). Probe the
  // paths where Vercel may have placed it, then fall back to a minimal shell.
  const candidates = [
    join(__dirname, 'dist', brand.shell),
    join(__dirname, brand.shell),
    join(__dirname, '..', 'dist', brand.shell),
  ];
  for (const p of candidates) {
    try {
      shellMemo[brand.shell] = readFileSync(p, 'utf8');
      return shellMemo[brand.shell];
    } catch (e) { /* try next */ }
  }
  shellMemo[brand.shell] = FALLBACK_SHELL;
  return shellMemo[brand.shell];
}

const FALLBACK_SHELL = `<!doctype html><html lang="en"><head><meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>ShemaleWiki Online</title></head><body><h1>ShemaleWiki Online</h1></body></html>`;

export default async function handler(req, res) {
  // Vercel Node runtime passes a RELATIVE req.url — give it a base so
  // new URL() never throws (that was a FUNCTION_INVOCATION_FAILED).
  const raw = req.url || '/';
  const url = new URL(raw.startsWith('http') ? raw : `http://local${raw.startsWith('/') ? '' : '/'}${raw}`);
  const qp = url.searchParams.get('path');
  const pathname = qp ? `/${String(qp).replace(/^\/+/, '')}` : url.pathname;
  const h = req.headers || {};
  const hget = (k) => (typeof h.get === 'function' ? h.get(k) : h[k]);
  const host = String(hget('x-forwarded-host') || hget('host') || 'shemalewiki.online').toLowerCase();
  const brand = host.includes('buscatrans') ? BRANDS.bt : BRANDS.sw;
  const parsed = parseProfileId(pathname);

  let og = { ...brand.og };
  let status = 200;
  let noindex = false;
  if (parsed) {
    try {
      const data = await getProfileData(brand, parsed.id);
      if (data.status === 'moved') {
        // Legacy id (old sitemap / old links) -> permanent redirect to the real profile URL.
        const target = `${parsed.prefix}/profile/${data.id}`;
        if (res && typeof res.end === 'function') {
          res.statusCode = 301;
          res.setHeader('Location', target);
          res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
          res.end();
          return;
        }
        return new Response(null, { status: 301, headers: { location: target, 'cache-control': 'public, max-age=3600, s-maxage=86400' } });
      }
      if (data.status === 'missing') {
        // Real "not found": the app still renders its own message, but crawlers get a 404 + noindex
        // instead of a 200 soft-404.
        status = 404;
        noindex = true;
      } else if (data.status === 'ok') {
        og = {
          title: data.name,
          desc: brand.profileDesc(data.name, data.location),
          image: data.image,
          imageW: data.hasPhoto ? '1200' : brand.og.imageW,
          imageH: data.hasPhoto ? '630' : brand.og.imageH,
        };
      }
    } catch (e) { /* default og */ }
  }

  const canonical = `${brand.base}${pathname.replace(/\/+$/, '') || '/'}`;
  const isProfile = Boolean(parsed) && status === 200 && og.title !== brand.og.title;
  const tags = [
    // data-static-seo: <SEO/> removes these once the app renders its own tags (avoids duplicates)
    '<meta property="og:type" content="website" />',
    `<meta property="og:title" content="${esc(og.title)}" data-static-seo />`,
    `<meta property="og:description" content="${esc(og.desc)}" data-static-seo />`,
    `<meta property="og:image" content="${esc(og.image)}" />`,
    `<meta property="og:image:width" content="${og.imageW}" />`,
    `<meta property="og:image:height" content="${og.imageH}" />`,
    `<meta property="og:url" content="${esc(canonical)}" data-static-seo />`,
    `<meta property="og:site_name" content="${esc(brand.siteName)}" />`,
    `<meta property="og:locale" content="${brand.locale}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${esc(og.title)}" data-static-seo />`,
    `<meta name="twitter:description" content="${esc(og.desc)}" data-static-seo />`,
    `<meta name="twitter:image" content="${esc(og.image)}" />`,
    `<title>${esc(isProfile ? `${og.title} — ${brand.name}` : og.title)}</title>`,
    `<meta name="description" content="${esc(og.desc)}" data-static-seo />`,
    // The old shell carried a canonical pointing at the shemalewiki home, so every profile on
    // buscatrans.com declared itself a duplicate of another site's homepage.
    ...(noindex ? ['<meta name="robots" content="noindex, follow" />'] : [`<link rel="canonical" href="${esc(canonical)}" data-static-seo />`]),
  ].join('\n    ');

  let html = getShell(brand);

  // Remove any pre-existing og/title/description/canonical tags (from the shell)
  // so the profile version wins and there is exactly one of each.
  html = html
    .replace(/\n?\s*<meta property="og:[^>]*\/>\n?/g, '\n')
    .replace(/\n?\s*<meta name="twitter:[^>]*\/>\n?/g, '\n')
    .replace(/\n?\s*<meta name="description"[^>]*\/>\n?/g, '\n')
    .replace(/\n?\s*<link rel="canonical"[^>]*\/>\n?/g, '\n')
    .replace(/\n?\s*<title>[^<]*<\/title>\n?/g, '\n');
  if (noindex) html = html.replace(/\n?\s*<meta name="robots"[^>]*\/>\n?/g, '\n');

  html = html.replace(/<meta charset="UTF-8" \/>/, `<meta charset="UTF-8" />\n    ${tags}`);

  const cache = status === 200 ? 'public, max-age=300, s-maxage=600' : 'public, max-age=60, s-maxage=120';
  if (res && typeof res.end === 'function') {
    res.statusCode = status;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', cache);
    res.end(html);
    return;
  }
  // Web-fetch fallback (GET export / edge)
  return new Response(html, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': cache,
    },
  });
}
