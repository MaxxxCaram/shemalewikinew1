import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * SEO component for per-page meta tags.
 * All pages get proper title, description, canonical, hreflang, and optional structured data.
 */
// The static HTML shell (and api/og.js for profiles) ships description/og/twitter/canonical tags
// marked data-static-seo so crawlers that do not run JS still get a sensible head. Helmet adds
// its own per-page copies but never removes those, which left two canonicals / descriptions /
// og:site_name on every page. Once this component renders, drop the static copies.
function useDropStaticSeo() {
  useEffect(() => {
    document.head.querySelectorAll('[data-static-seo]').forEach((el) => el.remove());
  }, []);
}

export default function SEO({ 
  title, 
  description, 
  keywords,
  canonicalPath = '',
  lang = 'en',
  alternates = [], // [{ lang: 'es', path: '/es/...' }, ...]
  jsonLd = null,
  ogImage = null,
}) {
  useDropStaticSeo();
  const isBuscaTrans = () => typeof window !== 'undefined' && window.location.hostname.includes('buscatrans');
  const baseUrl = isBuscaTrans() ? 'https://buscatrans.com' : 'https://shemalewiki.online';
  const otherUrl = isBuscaTrans() ? 'https://shemalewiki.online' : 'https://buscatrans.com';
  const brandName = isBuscaTrans() ? 'BuscaTrans' : 'ShemaleWiki Online';
  // Detect language from the URL path prefix so /fr /pt /he /es /nl pages get the right lang.
  const pathLang = () => {
    if (typeof window === 'undefined') return null;
    const p = window.location.pathname;
    if (p.startsWith('/fr')) return 'fr';
    if (p.startsWith('/pt')) return 'pt';
    if (p.startsWith('/he')) return 'he';
    if (p.startsWith('/es')) return 'es';
    if (p.startsWith('/nl')) return 'nl';
    return null;
  };
  // BuscaTrans is a Spanish-language brand: default lang to 'es' unless a page overrides it.
  const effectiveLang = (lang && lang !== 'en') ? lang : (pathLang() || (isBuscaTrans() ? 'es' : 'en'));
  const fullTitle = title 
    ? `${title} | ${brandName}` 
    : (isBuscaTrans() 
      ? 'BuscaTrans — Comunidad de Acompañantes Trans'
      : 'ShemaleWiki Online — Trans Community Directory');
  const fullCanonical = canonicalPath ? `${baseUrl}${canonicalPath}` : baseUrl;

  // Cross-domain (sibling site) hreflang alternates — language-matched & reciprocal.
  // Every language version of THIS page gets a counterpart link on the OTHER domain,
  // so Google sees a symmetric set and does NOT flag the two sites as duplicate content.
  const crossVersions = [{ lang: effectiveLang, path: canonicalPath || '/' }, ...alternates];
  const seenLang = new Set();
  const crossDomainLinks = crossVersions
    .filter((v) => (seenLang.has(v.lang) ? false : (seenLang.add(v.lang), true)))
    .map((v) => (
      <link
        key={`x-${v.lang}`}
        rel="alternate"
        hreflang={v.lang}
        href={`${otherUrl}${v.path}`}
      />
    ));

  return (
    <Helmet>
      <html lang={effectiveLang} />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={fullCanonical} />
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={brandName} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {/* Hreflang — intra-site language alternates */}
      {alternates.map((alt) => (
        <link 
          key={alt.lang}
          rel="alternate" 
          hreflang={alt.lang} 
          href={`${baseUrl}${alt.path}`} 
        />
      ))}
      {/* Hreflang — cross-domain (sibling site) alternates, language-matched & reciprocal */}
      {crossDomainLinks}
      {/* Self-referencing hreflang (required by Google) */}
      <link rel="alternate" hreflang={effectiveLang} href={fullCanonical} />
      {/* x-default hreflang (own-domain catch-all) */}
      <link rel="alternate" hreflang="x-default" href={`${baseUrl}${canonicalPath || '/'}`} />

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}
