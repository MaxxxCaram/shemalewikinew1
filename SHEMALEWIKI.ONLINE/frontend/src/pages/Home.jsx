import { Link } from 'react-router-dom';
import { Search, MapPin, ArrowRight, Sparkles, Globe2, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import SEO from '../components/SEO';
import AdSlot from '../components/AdSlot';
import useScrollReveal from '../useScrollReveal';
import { supabase } from '../supabase';
import logoSw from '../assets/shemalewiki-blurred-limits.jpg';

/* ── Brand detection ── */
const isBT = () => typeof window !== 'undefined' && window.location.hostname.includes('buscatrans');

// Verify a photo URL actually loads in the browser (onload + timeout).
// Returns the URL if it loads with real dimensions, otherwise null.
// Rejects: 1x1 transparents, tiny broken decodes, placeholders (<150px).
const PROXY = '/api/image?url=';
const verifyPhoto = (url) =>
  new Promise((resolve) => {
    if (!url) return resolve(null);
    // Since we already filter to PocketBase local-storage files (file != ''),
    // skip the slow per-image Image() probe and trust them — it was causing
    // the featured grid to hang on loading forever (128 profiles x 6 urls x 5s).
    resolve(url);
  });

// Try a list of candidate URLs in PARALLEL; return first that loads, else null.
const verifyFirst = async (urls) => {
  const results = await Promise.all((urls || []).map(u => u ? verifyPhoto(u) : Promise.resolve(null)));
  return results.find(Boolean) || null;
};

// Build candidate URLs for a profile: ddg storage first (original large photos),
// then other storage / eros, then archive via proxy. Cap at 6 for speed.
const candidateUrls = (photos) => {
  const ddg = [];
  const storage = [];
  const archive = [];
  const coverDdg = [];
  (photos || []).forEach(ph => {
    if (!ph?.photo_url) return;
    if (ph.photo_url.includes('/ddg/')) {
      ddg.push(ph.photo_url);
      if (ph.local_path === 'cover') coverDdg.push(ph.photo_url);
    } else if (ph.photo_url.includes('supabase.co/storage') || ph.photo_url.includes('static2.eros.bz') || ph.photo_url.includes('api.shemalewiki.online/api/files') || ph.photo_url.includes('/api/files/')) {
      storage.push(ph.photo_url);
    } else if (ph.photo_url.includes('web.archive.org')) {
      archive.push(`${PROXY}${encodeURIComponent(ph.photo_url)}`);
    }
  });
  return [...storage, ...coverDdg, ...ddg].slice(0, 6);
};

/* ── Content per brand ── */
const t = {
  shemalewiki: {
    eyebrow: 'BLURRED LIMITS',
    heading: 'Where desire meets',
    highlight: 'beyond the edge.',
    subtitle: 'Verified trans companions · 5,000+ profiles · 75 countries',
    searchPlaceholder: 'City, country or region...',
    pills: ['All', 'Bangkok', 'London', 'Miami', 'Amsterdam', 'São Paulo', 'Tokyo'],
    featuredTitle: 'Featured profiles',
    featuredLink: 'View all',
    citiesTitle: 'Browse by region',
    citiesLink: 'Full map',
    bottomNav: [
      { label: 'Home', icon: 'home', active: true },
      { label: 'Search', icon: 'search' },
      { label: 'Saved', icon: 'star' },
      { label: 'Account', icon: 'user' },
    ],
    heroLogo: true,
    stats: [
      { icon: 'globe', value: '75+', label: 'Countries' },
      { icon: 'users', value: '5K+', label: 'Profiles' },
      { icon: 'shield', value: '100%', label: 'Verified' },
    ],
  },
  buscatrans: {
    eyebrow: 'El directorio que te ve como sos',
    heading: 'Encontrá tu',
    highlight: 'conexión perfecta.',
    subtitle: 'Perfiles verificados · Discreto · Seguro',
    searchPlaceholder: 'Ciudad o país...',
    pills: ['Todas', 'Buenos Aires', 'Ciudad de México', 'Madrid', 'Lima', 'Bogotá'],
    featuredTitle: 'Perfiles destacados',
    featuredLink: 'Ver todos',
    citiesTitle: 'Por ciudad',
    citiesLink: 'Ver mapa',
    bottomNav: [
      { label: 'Inicio', icon: 'home', active: true },
      { label: 'Buscar', icon: 'search' },
      { label: 'Guardados', icon: 'heart' },
      { label: 'Mi perfil', icon: 'user' },
    ],
    heroLogo: false,
    stats: [
      { icon: 'globe', value: '75+', label: 'Países' },
      { icon: 'users', value: '5K+', label: 'Perfiles' },
      { icon: 'shield', value: '100%', label: 'Verificado' },
    ],
  },
  };

const StatIcon = ({ icon }) => {
  if (icon === 'globe') return <Globe2 size={20} />;
  if (icon === 'shield') return <ShieldCheck size={20} />;
  if (icon === 'users') return <Sparkles size={20} />;
  return null;
};

export default function Home() {
  const brand = isBT() ? 'buscatrans' : 'shemalewiki';
  const content = t[brand];
  const [activePill, setActivePill] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [geoCountry, setGeoCountry] = useState(null);

  // Vanguard scroll-reveal for ShemaleWiki feature cards + city block
  useScrollReveal([profiles]);

  const canonPath = brand === 'buscatrans' ? '/es/' : '/';
  const lang = brand === 'buscatrans' ? 'es' : 'en';
  const siteName = brand === 'buscatrans' ? 'BuscaTrans' : 'ShemaleWiki';

  // Fetch real approved profiles that HAVE photos. The DB stores 42k+ photos
  // in Supabase Storage, linked from the `photos` table by profile_id. Most
  // recent profiles lack photos, so we query the photo table first to get the
  // profile_ids that actually have images, then fetch those profiles.
  useEffect(() => {
    (async () => {
      try {
        // 0. Detect visitor country client-side (timezone + language).
        //    No server function needed (Vercel Hobby caps at 12 APIs) and no
        //    permission prompt. Covers the vast majority of real visitors.
        let geoCountryName = null;
        try {
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
          const COUNTRY_BY_TZ = {
            'Europe/Amsterdam': 'Netherlands', 'Europe/Madrid': 'Spain',
            'Europe/Paris': 'France', 'Europe/Brussels': 'Belgium',
            'America/Mexico_City': 'Mexico', 'America/Argentina/Buenos_Aires': 'Argentina',
            'America/Buenos_Aires': 'Argentina', 'America/Sao_Paulo': 'Brazil',
            'Europe/Berlin': 'Germany', 'Europe/London': 'United Kingdom',
            'Europe/Rome': 'Italy', 'Europe/Lisbon': 'Portugal',
            'America/New_York': 'United States', 'America/Chicago': 'United States',
            'America/Los_Angeles': 'United States', 'Europe/Zurich': 'Switzerland',
            'Europe/Vienna': 'Austria',
          };
          geoCountryName = COUNTRY_BY_TZ[tz] || null;
          // language fallback (e.g. 'es-419' variants, 'nl', 'pt-BR')
          if (!geoCountryName) {
            const lang = (navigator.language || '').toLowerCase();
            if (lang.startsWith('nl')) geoCountryName = 'Netherlands';
            else if (lang.startsWith('es-ar')) geoCountryName = 'Argentina';
          }
        } catch { /* Intl unavailable — global fallback below */ }
        if (geoCountryName) setGeoCountry(geoCountryName);

        const hasRealPhoto = (p) => (p.photos || []).some(ph => {
          const u = ((ph?.photo_url) || '').toLowerCase();
          if (ph?.file) return true;
          if (/web\.archive\.org|shemalewiki\.com|xhamster|youtube|pornhub|xvideos/.test(u)) return false;
          return u.includes('api/files') || u.includes('eros');
        });

        const pickVerified = (list, want) => {
          const out = [];
          for (const p of list) {
            if (!hasRealPhoto(p)) continue;
            const cover = (p.photos || []).find(ph => ph.file) || (p.photos || [])[0];
            out.push({ ...p, _verifiedPhoto: cover?.photo_url });
            if (out.length >= want) break;
          }
          return out;
        };

        let verified = [];
        // 1. Try geo: profiles from the visitor's country first.
        if (geoCountryName) {
          const { data: local } = await supabase
            .from('profiles')
            .select('*, photos(photo_url, local_path, file)')
            .not('cam_chat', 'eq', 'rejected')
            .ilike('location', `% | ${geoCountryName}%`)
            .order('created_at', { ascending: false })
            .limit(200);
          verified = pickVerified(Array.isArray(local) ? local : [], 12);
          console.log('[Home] geo:', geoCountryName, '| perfiles locales con foto:', verified.length);
        }

        // 2. Fill up with global recents (never show an empty grid).
        if (verified.length < 12) {
          const { data: recent, error: e1 } = await supabase
            .from('profiles')
            .select('*, photos(photo_url, local_path, file)')
            .not('cam_chat', 'eq', 'rejected')
            .order('created_at', { ascending: false })
            .limit(200);
          if (e1) throw e1;
          const have = new Set(verified.map(p => p.id));
          const rest = (Array.isArray(recent) ? recent : []).filter(p => !have.has(p.id));
          verified = verified.concat(pickVerified(rest, 12 - verified.length));
        }

        console.log('[Home] featured final:', verified.length);
        setProfiles(verified.slice(0, 12));
      } catch (err) {
        console.error('Home fetch failed:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getCitySlug = (location) => {
    const parts = (location || '').split(' | ');
    const city = parts[parts.length - 1];
    return city.toLowerCase().replace(/\s+/g, '-');
  };

  const getContinentSlug = (location) => {
    const parts = (location || '').split(' | ');
    return parts[0]?.toLowerCase() || 'europe';
  };

  const getCountrySlug = (location) => {
    const parts = (location || '').split(' | ');
    return parts[1]?.toLowerCase() || '';
  };

  const getProfilePhoto = (p) => {
    // Use the pre-verified working photo (set during fetch)
    if (p._verifiedPhoto) return p._verifiedPhoto;
    if (p.photos && p.photos.length > 0) {
      const cover = p.photos.find(ph => ph.local_path === 'cover');
      return cover ? cover.photo_url : p.photos[0].photo_url;
    }
    return null;
  };

  const getProfileLink = (p) => {
    const continent = getContinentSlug(p.location);
    const country = getCountrySlug(p.location);
    const city = getCitySlug(p.location);
    // Featured cards should always link to the profile itself: city slugs can
    // point to landing pages with "No profiles found" (e.g. /other/unknown/unknown).
    if (continent && country && city && country !== 'unknown' && city !== 'unknown') {
      return `/${continent}/${country}/${city}`;
    }
    return `/profile/${p.id}`;
  };

  return (
    <>
      <SEO
        title={siteName === 'BuscaTrans' ? 'BuscaTrans — Comunidad Global de Mujeres Trans Verificadas' : 'Trans Community Directory'}
        description={content.subtitle}
        canonicalPath={canonPath}
        lang={lang}
      />

      {/* ── HERO ── */}
      <section className="hero-section">
        {brand === 'shemalewiki' && (
          <div className="hero-logo-wrap">
            <img src={logoSw} alt="ShemaleWiki Online" className="hero-logo-giant" />
          </div>
        )}
        <p className="hero-eyebrow">{content.eyebrow}</p>
        <h1 className="hero-title">
          {content.heading}{' '}
          <span className="highlight">{content.highlight}</span>
        </h1>
        <p className="hero-subtitle">{content.subtitle}</p>

        {/* Trans Dashboard CTA — ShemaleWiki */}
        {brand === 'shemalewiki' && (
          <Link to="/dashboard/login" className="btn btn-trans-dashboard">
            🏳️‍⚧️ If you are trans, click here
          </Link>
        )}

        {/* Search */}
        <div className="search-container">
          <input
            className="search-input"
            type="text"
            aria-label={brand === 'buscatrans' ? 'Buscar perfiles por ciudad o país' : 'Search profiles by city or country'}
            placeholder={content.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { window.location.href = brand === 'buscatrans' ? `/es/europe${searchQuery ? '?search=' + encodeURIComponent(searchQuery) : ''}` : `/europe${searchQuery ? '?search=' + encodeURIComponent(searchQuery) : ''}`; } }}
          />
          <Link to={brand === 'buscatrans' ? '/es/europe' : '/europe'} className="btn btn-primary btn-lg" style={{ textDecoration: 'none' }}>
            <Search size={18} />
            {brand === 'buscatrans' ? 'Buscar' : 'Search'}
            <ArrowRight size={16} style={{ marginLeft: '0.25rem' }} />
          </Link>
        </div>

        {/* Filter pills — functional: navigate to city search */}
        <div className="filter-pills" role="group" aria-label={brand === 'buscatrans' ? 'Filtrar por ciudad' : 'Filter by city'}>
          {content.pills.map((pill, i) => {
            const isAll = pill === 'All' || pill === 'Todas';
            const searchTarget = isAll
              ? (brand === 'buscatrans' ? '/es/europe' : '/europe')
              : (brand === 'buscatrans' ? `/es/europe?search=${encodeURIComponent(pill)}` : `/europe?search=${encodeURIComponent(pill)}`);
            return (
              <Link
                key={pill}
                to={searchTarget}
                className={`filter-pill ${i === activePill ? 'active' : ''}`}
                onClick={() => setActivePill(i)}
              >
                {pill}
              </Link>
            );
          })}
        </div>

        {/* Stats row */}
        <div className="hero-stats">
          {content.stats.map((stat, i) => (
            <div key={i} className="hero-stat">
              <span className="hero-stat-icon"><StatIcon icon={stat.icon} /></span>
              <span className="hero-stat-val">{stat.value}</span>
              <span className="hero-stat-lbl">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

            {/* ── AD SLOT: clientes (home) ── */}
            <AdSlot slot="home-top" audience="clients" width={728} height={90} className="ad-top" />

            {/* ── FEATURED PROFILES ── */}
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">
            {geoCountry ? `${content.featuredTitle} · ${geoCountry}` : content.featuredTitle}
          </h2>
          <Link to={brand === 'buscatrans' ? '/es/europe' : '/europe'} className="section-link">{content.featuredLink}</Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          </div>
        ) : profiles.length > 0 ? (
          <div className="profiles-grid">
            {profiles.map((p, i) => {
              const photo = getProfilePhoto(p);
              const link = getProfileLink(p);
              return (
                <Link to={link} key={p.id} className="glass-card sw-reveal" style={{ textDecoration: 'none', color: 'inherit', '--sw-delay': `${i * 0.06}s` }}>
                  <div style={{
                    height: '360px',
                    background: photo ? `url(${photo}) center/cover` : 'var(--card-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-secondary)', fontSize: '3rem', position: 'relative'
                  }}>
                    {!photo && '👤'}
                    {p.cam_chat === 'approved' && (
                      <span style={{
                        position: 'absolute', top: '1rem', right: '1rem',
                        padding: '0.3rem 0.75rem', borderRadius: '999px',
                        background: 'rgba(34,197,94,0.2)', color: '#22c55e',
                        fontSize: '0.7rem', fontWeight: 600, letterSpacing: '-0.01em',
                        backdropFilter: 'blur(10px)', border: '1px solid rgba(34,197,94,0.35)',
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem'
                      }}>
                        <ShieldCheck size={12} /> Verified
                      </span>
                    )}
                  </div>
                  <div className="profile-card-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 className="profile-card-title">{p.name}</h3>
                    </div>
                    <div className="profile-card-meta">
                      <span><MapPin size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />{getCitySlug(p.location).replace(/-/g, ' ') || p.location}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
            <p>{brand === 'buscatrans' ? 'No hay perfiles todavía. ¡Sé la primera en registrarte!' : 'No approved profiles yet. Be the first!'}</p>
            <Link to={brand === 'buscatrans' ? '/registro' : '/register'} className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block', textDecoration: 'none' }}>
              {brand === 'buscatrans' ? 'Crear perfil' : 'List your profile'}
            </Link>
          </div>
        )}

        {/* ── CITY MAP SECTION ── */}
        <div className="section-header sw-reveal">
          <h2 className="section-title">{content.citiesTitle}</h2>
          <Link to={brand === 'buscatrans' ? '/es/europe' : '/europe'} className="section-link">{content.citiesLink}</Link>
        </div>
        <div className="map-placeholder sw-reveal">
          <MapPin size={48} style={{ opacity: 0.4 }} />
          <p style={{ marginTop: '0.75rem', fontSize: '1rem', fontWeight: 500 }}>
            {brand === 'buscatrans' ? 'Mapa interactivo de ciudades' : 'Interactive world map'}
          </p>
          <p style={{ marginTop: '0.25rem', fontSize: '0.88rem', opacity: 0.7 }}>
            {brand === 'buscatrans' ? 'Próximamente' : 'Coming soon'}
          </p>
        </div>
      </div>

      <div style={{ height: '80px' }} />

      {/* ── BOTTOM NAV (mobile) ── */}
      <nav className="bottom-nav" aria-label={brand === 'buscatrans' ? 'Navegación' : 'Navigation'}>
        <div className="bottom-nav-items">
          {content.bottomNav.map((item, i) => {
            const linkMap = {
              home: brand === 'buscatrans' ? '/es/' : '/',
              search: brand === 'buscatrans' ? '/es/europe' : '/europe',
              star: brand === 'buscatrans' ? '/es/europe' : '/europe',
              heart: brand === 'buscatrans' ? '/es/europe' : '/europe',
              user: '/dashboard/login',
            };
            return (
              <Link
                key={i}
                to={linkMap[item.icon] || '/'}
                className={`bottom-nav-item ${item.active ? 'active' : ''}`}
                aria-label={item.label}
              >
                {item.icon === 'home' && '🏠'}
                {item.icon === 'search' && '🔍'}
                {item.icon === 'star' && '⭐'}
                {item.icon === 'heart' && '❤️'}
                {item.icon === 'user' && '👤'}
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}