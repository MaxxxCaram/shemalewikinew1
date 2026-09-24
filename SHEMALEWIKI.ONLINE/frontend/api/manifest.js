// api/manifest.js — PWA manifest por marca (host-aware), como sitemap.js.
const SW = {
  name: 'ShemaleWiki Online — Trans Companion Directory',
  short_name: 'ShemaleWiki',
  description: "The world's premier multilingual directory of trans companions. Browse verified profiles by country and city.",
  start_url: '/',
  scope: '/',
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#0a0a0f',
  theme_color: '#e83e8c',
  lang: 'en',
  categories: ['social', 'lifestyle'],
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
    { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
  shortcuts: [
    { name: 'Buscar perfiles', short_name: 'Buscar', url: '/europe' },
    { name: 'Publicar mi perfil', short_name: 'Publicar', url: '/register' },
  ],
};

const BT = {
  name: 'BuscaTrans — Trans Companion Directory',
  short_name: 'BuscaTrans',
  description: 'El directorio en español de chicas trans con fotos y contacto. Encontrá acompañantes verificadas por país y ciudad.',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#0a0a0f',
  theme_color: '#e83e8c',
  lang: 'es',
  categories: ['social', 'lifestyle'],
  icons: SW.icons,
  shortcuts: [
    { name: 'Buscar perfiles', short_name: 'Buscar', url: '/es/europe' },
    { name: 'Publicar mi perfil', short_name: 'Publicar', url: '/register' },
  ],
};

export default async function handler(req, res) {
  const h = req.headers || {};
  const hget = (k) => (typeof h.get === 'function' ? h.get(k) : h[k]);
  const host = hget('host') || 'shemalewiki.online';
  const manifest = String(host).includes('buscatrans') ? BT : SW;
  const body = JSON.stringify(manifest);
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.end(body);
}