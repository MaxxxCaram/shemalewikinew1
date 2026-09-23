// api/og.js — server-rendered OpenGraph for /profile/<id> (crawler previews).
//
// The Vercel rewrite routes /profile/* here. We resolve name + cover from
// PocketBase and inject og tags into the app shell. The shell comes from the
// lambda bundle (vercel.json: functions.api/og.js.includeFiles = dist/index.html)
// because a function fetching its own origin deadlocks inside Vercel.
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PB = 'https://api.shemalewiki.online';
const DEFAULT_OG = {
  title: 'ShemaleWiki Online — Trans Companion Directory',
  desc: "The world's premier multilingual directory of trans companions. Browse verified profiles by country and city.",
  image: 'https://shemalewiki.online/logosw.png',
  imageW: '512',
  imageH: '512',
};
const BRANDS = {
  shemalewiki: {
    title: 'ShemaleWiki Online — Trans Companion Directory',
    desc: "The world's premier multilingual directory of trans companions. Browse verified profiles by country and city.",
    image: 'https://shemalewiki.online/logosw.png',
    siteName: 'ShemaleWiki',
    suffix: 'ShemaleWiki',
  },
  buscatrans: {
    title: 'BuscaTrans — Trans Companion Directory',
    desc: 'El directorio en español de chicas trans con fotos y contacto. Encontrá acompañantes verificadas por país y ciudad.',
    image: 'https://buscatrans.com/logos/buscatrans-new-logo.jpg',
    siteName: 'BuscaTrans',
    suffix: 'BuscaTrans',
  },
};
const brandFor = (host) => (String(host || '').includes('buscatrans') ? BRANDS.buscatrans : BRANDS.shemalewiki);

// Photos collection id (stable). Used as fallback for the file URL.
const PHOTOS_COLLECTION = 'u4i29ndk3g7bsv5';

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const q = (s) => s.replace(/'/g, "''");

function parseProfileId(pathname) {
  // /profile/abc123, /es/profile/abc123, /pt/profile/abc123 ...
  const m = pathname.match(/\/(?:[a-z]{2}\/)?profile\/([A-Za-z0-9]+)\/?$/);
  return m ? m[1] : null;
}

async function getProfileData(profileId) {
  if (!profileId) return null;
  const [profRes, photoRes] = await Promise.all([
    fetch(`${PB}/api/collections/profiles/records?perPage=1&fields=id,name,location&filter=${encodeURIComponent(`(id='${q(profileId)}')&&(cam_chat!='rejected')`)}`),
    fetch(`${PB}/api/collections/photos/records?perPage=1&sort=-created&fields=id,file,collectionId&filter=${encodeURIComponent(`(profile_id='${q(profileId)}')&&(local_path='cover')&&(file!='')`)}`),
  ]);
  if (!profRes.ok) return null;
  const prof = await profRes.json();
  const profile = (prof.items || [])[0];
  if (!profile) return null;

  let image = DEFAULT_OG.image;
  if (photoRes.ok) {
    const ph = ((await photoRes.json()).items || [])[0];
    if (ph && ph.file) {
      const collection = ph.collectionId || PHOTOS_COLLECTION;
      image = `${PB}/api/files/${collection}/${ph.id}/${encodeURIComponent(ph.file)}`;
    }
  }
  return { name: profile.name || profileId, location: profile.location || '', image };
}

let shellMemo = null;
function getShell() {
  if (shellMemo) return shellMemo;
  // The shell is bundled into the lambda via vercel.json functions.includeFiles
  // (self-fetching the site inside a function deadlocks in Vercel). Probe the
  // paths where Vercel may have placed it, then fall back to a minimal shell.
  const candidates = [
    join(__dirname, 'dist', 'index.html'),
    join(__dirname, 'index.html'),
    join(__dirname, '..', 'dist', 'index.html'),
  ];
  for (const p of candidates) {
    try {
      shellMemo = readFileSync(p, 'utf8');
      return shellMemo;
    } catch (e) { /* try next */ }
  }
  shellMemo = FALLBACK_SHELL;
  return shellMemo;
}

const FALLBACK_SHELL = `<!doctype html><html lang="en"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
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
  const proto = String(hget('x-forwarded-proto') || 'https').split(',')[0].trim();
  const host = hget('host') || 'shemalewiki.online';
  const protocolHost = `${proto}://${host}`;
  const profileId = parseProfileId(pathname);

  const brand = brandFor(host);
  let og = { title: brand.title, desc: brand.desc, image: brand.image, imageW: '512', imageH: '512' };
  if (profileId) {
    try {
      const data = await getProfileData(profileId);
      if (data) {
        const city = (data.location.split(' | ').pop() || '').trim();
        og = {
          title: data.name,
          desc: city ? `${data.name} — ${data.location}` : `Profile of ${data.name} on ${brand.suffix}`,
          image: data.image,
          imageW: data.image === DEFAULT_OG.image ? '512' : '1200',
          imageH: data.image === DEFAULT_OG.image ? '512' : '630',
        };
      }
    } catch (e) { /* default og */ }
  }

  const canonical = `${protocolHost}${pathname}`;
  const tags = [
    '<meta property="og:type" content="website" />',
    `<meta property="og:title" content="${esc(og.title)}" />`,
    `<meta property="og:description" content="${esc(og.desc)}" />`,
    `<meta property="og:image" content="${esc(og.image)}" />`,
    `<meta property="og:image:width" content="${og.imageW}" />`,
    `<meta property="og:image:height" content="${og.imageH}" />`,
    `<meta property="og:url" content="${esc(canonical)}" />`,
    `<meta property="og:site_name" content="${brand.siteName}" />`,
    `<meta name="twitter:card" content="${profileId ? 'summary_large_image' : 'summary_large_image'}" />`,
    `<meta name="twitter:title" content="${esc(og.title)}" />`,
    `<meta name="twitter:description" content="${esc(og.desc)}" />`,
    `<meta name="twitter:image" content="${esc(og.image)}" />`,
    `<title>${esc(profileId && og.title !== brand.title ? `${og.title} — ${brand.suffix}` : og.title)}</title>`,
    `<meta name="description" content="${esc(og.desc)}" />`,
  ].join('\n    ');

  let html = getShell();

  // Remove any pre-existing og/title/description tags (from the default shell)
  // so the profile version wins and there is exactly one of each.
  html = html
    .replace(/\n?\s*<meta property="og:[^>]*\/>\n?/g, '\n')
    .replace(/\n?\s*<meta name="twitter:[^>]*\/>\n?/g, '\n')
    .replace(/\n?\s*<meta name="description"[^>]*\/>\n?/g, '\n')
    .replace(/\n?\s*<title>[^<]*<\/title>\n?/g, '\n');

  html = html.replace(/<meta charset="UTF-8" \/>/, `<meta charset="UTF-8" />\n    ${tags}`);

  if (res && typeof res.end === 'function') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600');
    res.end(html);
    return;
  }
  // Web-fetch fallback (GET export / edge)
  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=300, s-maxage=600',
    },
  });
}