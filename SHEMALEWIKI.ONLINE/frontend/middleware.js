/**
 * Vercel Edge Middleware — Per-route static SEO metadata injection for the SPA.
 *
 * Problem: every SPA route serves the same static index.html with a generic
 * <title>/<meta description>. Crawlers that DON'T execute JS (some AI bots,
 * some link-previewers) therefore see identical metadata on every page.
 *
 * Solution: this middleware intercepts HTML responses for SPA routes, looks up
 * the path + hostname, and rewrites <title> and <meta name="description">
 * (plus og:title / og:description) in the served HTML — WITHOUT touching the
 * React app. The SPA still mounts and renders client-side as before.
 *
 * - No external dependencies (runs on the Vercel Edge runtime, Web APIs only).
 * - Only rewrites text/html responses; static assets and /api/* pass through.
 * - Brand-aware: buscatrans.com gets Spanish metadata, shemalewiki.online gets
 *   English (Spanish sub-routes like /guia get Spanish on either host).
 */

// Brand text used as suffix / fallback.
const BRAND_EN = 'ShemaleWiki Online';
const BRAND_ES = 'BuscaTrans';

/**
 * Per-route metadata. Keys are normalized pathnames (leading slash, no trailing
 * slash except root). Values are { en, es } (host-browser decides which).
 * A missing es falls back to en; a missing key falls back to the generic map.
 */
const ROUTE_META = {
  '/': {
    en: {
      title: 'ShemaleWiki Online — Verified Trans Companion Directory',
      description:
        "The world's premier multilingual directory of verified trans companions, escorts and TS models. Browse by continent and country — every profile is manually reviewed.",
    },
    es: {
      title: 'BuscaTrans — Directorio de Acompañantes Trans Verificadas',
      description:
        'Directorio gratuito de acompañantes trans, escorts y modelos TS verificadas en todo el mundo. Explorá por continente y país.',
    },
  },
  '/guide': {
    en: {
      title: 'How to Hire a Trans Escort Safely — Safety Guide',
      description:
        'A practical safety guide on verifying profiles, secure payment, consent and boundaries when hiring a trans companion or escort.',
    },
    es: {
      title: 'Cómo Contratar una Acompañante Trans de Forma Segura — Guía',
      description:
        'Guía práctica de seguridad: verificar perfiles, pagos seguros, consentimiento y límites al contratar una acompañante trans.',
    },
  },
  '/harm-reduction': {
    en: {
      title: 'Harm Reduction Guide — ShemaleWiki Online',
      description:
        'Harm reduction guidance for trans companions and clients: safety, health, consent and support resources.',
    },
    es: {
      title: 'Guía de Reducción de Daños — BuscaTrans',
      description:
        'Guía de reducción de daños para acompañantes trans y clientes: seguridad, salud, consentimiento y recursos de apoyo.',
    },
  },
  '/about': {
    en: {
      title: 'About — ShemaleWiki Online',
      description:
        'Learn about ShemaleWiki Online: a free, multilingual directory of verified trans companions built for safety and trust.',
    },
    es: {
      title: 'Sobre Nosotros — BuscaTrans',
      description:
        'Conocé BuscaTrans: un directorio gratuito y multilingüe de acompañantes trans verificadas, basado en seguridad y confianza.',
    },
  },
  '/books': {
    en: {
      title: 'The Sex Worker\u2019s Sacred Covenant — ShemaleWiki Books',
      description:
        'The Sex Worker\u2019s Sacred Covenant: a book on the lives, dignity and experiences of sex workers and trans companions.',
    },
    es: {
      title: 'Libros — BuscaTrans',
      description:
        'Descubrí nuestros libros, incluyendo "The Sex Worker\u2019s Sacred Covenant", sobre la vida y la dignidad de las trabajadoras sexuales.',
    },
  },
  '/launch': {
    en: {
      title: 'Launch — ShemaleWiki Online',
      description:
        'ShemaleWiki Online launch: discover verified trans companions from around the world. Explore continents and countries.',
    },
    es: {
      title: 'Lanzamiento — BuscaTrans',
      description:
        'Lanzamiento de BuscaTrans: descubrí acompañantes trans verificadas de todo el mundo. Explorá continentes y países.',
    },
  },
  '/advertise': {
    en: {
      title: 'Advertise Your Profile — ShemaleWiki Online',
      description:
        'List your profile for free on ShemaleWiki Online and reach verified trans-companion seekers worldwide.',
    },
    es: {
      title: 'Anunciá Tu Perfil — BuscaTrans',
      description:
        'Publicá tu perfil gratis en BuscaTrans y llegá a personas que buscan acompañantes trans verificadas en todo el mundo.',
    },
  },
  '/register': {
    en: {
      title: 'Register Your Profile — ShemaleWiki Online',
      description:
        'Create and submit your companion profile on ShemaleWiki Online. Profiles are manually reviewed before going live.',
    },
    es: {
      title: 'Registrá Tu Perfil — BuscaTrans',
      description:
        'Creá y enviá tu perfil en BuscaTrans. Los perfiles son revisados manualmente antes de publicarse.',
    },
  },
  '/contact': {
    en: {
      title: 'Contact Us — ShemaleWiki Online',
      description: 'Contact the ShemaleWiki Online team for support, advertising or questions.',
    },
    es: {
      title: 'Contacto — BuscaTrans',
      description: 'Contactá al equipo de BuscaTrans para soporte, publicidad o consultas.',
    },
  },
  '/terms': {
    en: { title: 'Terms of Service — ShemaleWiki Online', description: 'Terms of service for using ShemaleWiki Online.' },
    es: { title: 'Términos y Condiciones — BuscaTrans', description: 'Términos y condiciones de uso de BuscaTrans.' },
  },
  '/privacy': {
    en: { title: 'Privacy Policy — ShemaleWiki Online', description: 'Privacy policy for ShemaleWiki Online.' },
    es: { title: 'Política de Privacidad — BuscaTrans', description: 'Política de privacidad de BuscaTrans.' },
  },
  '/reclama': {
    en: { title: 'Claim Your Profile — ShemaleWiki Online', description: 'Claim and manage your profile on ShemaleWiki Online.' },
    es: { title: 'Reclamá Tu Perfil — BuscaTrans', description: 'Reclamá y gestioná tu perfil en BuscaTrans.' },
  },
};

// Spanish route aliases -> canonical EN keys. Spanish paths are used directly on
// buscatrans.com and as fallbacks; resolveMeta normalizes them to the EN key so the
// same {en, es} entry is reused (Spanish text is served when the host is BuscaTrans).
const ROUTE_ALIASES = {
  '/guia': '/guide',
  '/guia-reduccion-danos': '/harm-reduction',
  '/sobre-nosotros': '/about',
  '/libros': '/books',
  '/lanzamiento': '/launch',
  '/anunciar': '/advertise',
  '/registro': '/register',
  '/contacto': '/contact',
};

// Continent name mapping (slug -> display name). Both EN and ES variants.
const CONTINENTS_EN = {
  europe: 'Europe', americas: 'Americas', asia: 'Asia', africa: 'Africa', oceania: 'Oceania',
};
const CONTINENTS_ES = {
  europe: 'Europa', americas: 'Américas', asia: 'Asia', africa: 'África', oceania: 'Oceanía',
};

const CONTINENT_SLUGS = Object.keys(CONTINENTS_EN); // known route segments
const LANG_PREFIXES = ['/en/', '/es/', '/pt/', '/he/'];

function capitalize(slug) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Resolve metadata for a path. Returns {title, description} or null. */
export function resolveMeta(path) {
  // Force ENGLISH for ShemaleWiki Online — the middleware only runs on
  // shemalewiki.online (guarded in middleware()), so metadata is always en.
  const isSpanish = false;

  // Strip language prefix for matching /es/... paths against /... keys.
  let key = path;
  for (const p of LANG_PREFIXES) {
    if (path.startsWith(p)) {
      key = path.slice(p.length - 1); // keep leading '/', drop the 'es/' part
      break;
    }
  }
  if (!key.startsWith('/')) key = '/' + key;
  key = ROUTE_ALIASES[key] || key;

  let entry = ROUTE_META[key];

  // Country / city / continent routes: /europe, /europe/spain, /es/europe/spain/madrid
  if (!entry) {
    const segs = key.split('/').filter(Boolean);
    const first = (segs[0] || '').toLowerCase();
    if (CONTINENT_SLUGS.includes(first)) {
      const continentEn = CONTINENTS_EN[first];
      const continentEs = CONTINENTS_ES[first];
      const country = segs[1] ? capitalize(segs[1]) : null;
      const city = segs[2] ? capitalize(segs[2]) : null;

      if (city) {
        entry = {
          en: {
            title: `Trans Companions in ${city}, ${country} — ${BRAND_EN}`,
            description: `Verified trans companions and escorts in ${city}, ${country}. Browse profiles, photos and contact details on ${BRAND_EN}.`,
          },
          es: {
            title: `Acompañantes Trans en ${city}, ${country} — ${BRAND_ES}`,
            description: `Acompañantes trans y escorts verificadas en ${city}, ${country}. Mirá perfiles, fotos y datos de contacto en ${BRAND_ES}.`,
          },
        };
      } else if (country) {
        entry = {
          en: {
            title: `Trans Companions in ${country} — ${BRAND_EN}`,
            description: `Verified trans companions and escorts in ${country}. Browse profiles by city on ${BRAND_EN}.`,
          },
          es: {
            title: `Acompañantes Trans en ${country} — ${BRAND_ES}`,
            description: `Acompañantes trans y escorts verificadas en ${country}. Explorá perfiles por ciudad en ${BRAND_ES}.`,
          },
        };
      } else {
        entry = {
          en: {
            title: `Trans Escorts in ${continentEn} — ${BRAND_EN}`,
            description: `Verified trans companions and escorts across ${continentEn}. Browse profiles by country on ${BRAND_EN}.`,
          },
          es: {
            title: `Acompañantes Trans en ${continentEs} — ${BRAND_ES}`,
            description: `Acompañantes trans y escorts verificadas en ${continentEs}. Explorá perfiles por país en ${BRAND_ES}.`,
          },
        };
      }
    }
  }

  if (!entry) return null;

  const lang = isSpanish && entry.es ? 'es' : 'en';
  return entry[lang];
}

/** Rewrite <title>, meta description and OG tags inside the HTML string. */
export function injectMeta(html, meta) {
  // Escape attribute-special chars so quotes in titles/descriptions can't break HTML.
  const esc = (s) =>
    String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const title = esc(meta.title);
  const description = esc(meta.description);
  let out = html;

  // Replace <title>...</title>
  out = out.replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${title}</title>`);

  // Replace <meta name="description" ...>
  out = out.replace(
    /<meta[^>]*name=["']description["'][^>]*>/i,
    () => `<meta name="description" content="${description}" />`
  );

  // Replace og:title / og:description
  out = out.replace(/<meta[^>]*property=["']og:title["'][^>]*>/i, () => `<meta property="og:title" content="${title}" />`);
  out = out.replace(/<meta[^>]*property=["']og:description["'][^>]*>/i, () => `<meta property="og:description" content="${description}" />`);
  out = out.replace(/<meta[^>]*name=["']twitter:title["'][^>]*>/i, () => `<meta name="twitter:title" content="${title}" />`);
  out = out.replace(/<meta[^>]*name=["']twitter:description["'][^>]*>/i, () => `<meta name="twitter:description" content="${description}" />`);

  return out;
}

/** Static-file extension check — these never carry HTML metadata worth rewriting. */
const STATIC_EXT_RE = /\.(js|mjs|css|png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf|otf|eot|map|json|webmanifest|xml|txt|pdf|zip|mp4|webm)$/i;

export default async function middleware(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const host = url.hostname || '';

  // ONLY apply to ShemaleWiki Online (shemalewiki.online). BuscaTrans passes through untouched.
  if (!host.includes('shemalewiki')) return;

  // Pass through non-HTML assets and API routes untouched.
  if (STATIC_EXT_RE.test(path)) return;
  if (path.startsWith('/api/')) return;
  // Exclude special non-SPA paths (robots, sitemaps, manifest, etc.)
  if (/^\/(robots|sitemap|sitemap-main|manifest|llms|favicon)/.test(path)) return;

  const meta = resolveMeta(path);
  if (!meta) return; // no mapping -> serve unchanged

  // Fetch the actual response (index.html for SPA routes) and rewrite it.
  const response = await fetch(request);
  if (!response) return;
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  const html = await response.text();
  const newHtml = injectMeta(html, meta);

  const headers = new Headers(response.headers);
  // Keep headers (incl. vercel.json CSP/cache rules) but fix length for new body.
  const body = new TextEncoder().encode(newHtml);
  headers.set('Content-Length', String(body.byteLength));

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export const config = {
  // Run for SPA routes only (mirror of the vercel.json SPA rewrite exclusion).
  matcher: [
    '/((?!api/|assets/|_expo/|favicon|robots|sitemap|llms|logosw|icons|city-guides|downloads|mision|manifest|.*\\.(?:js|css|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|json|map|xml|txt)).*)',
  ],
};
