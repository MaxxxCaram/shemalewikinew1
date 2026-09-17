import { Link } from 'react-router-dom';
import { Search, MapPin, ArrowRight, Sparkles, Globe2, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import SEO from '../components/SEO';
import AdSlot from '../components/AdSlot';
import WorldMap from '../components/WorldMap';
import useScrollReveal from '../useScrollReveal';
import { supabase } from '../supabase';
import logoSw from '../assets/shemalewiki-blurred-limits.jpg';

const isBT = () => typeof window !== 'undefined' && window.location.hostname.includes('buscatrans');

const t = {
  shemalewiki: {
    eyebrow: 'BLURRED LIMITS', heading: 'Where desire meets', highlight: 'beyond the edge.',
    subtitle: 'Trans companions · 5,000+ profiles · 75 countries',
    searchPlaceholder: 'City, country or region...',
    pills: ['All', 'Bangkok', 'London', 'Miami', 'Amsterdam', 'São Paulo', 'Tokyo'],
    featuredTitle: 'Featured profiles', featuredLink: 'View all',
    citiesTitle: 'Browse by region', citiesLink: 'Full map',
    heroLogo: true,
    stats: [
      { icon: 'globe', value: '75+', label: 'Countries' },
      { icon: 'users', value: '5K+', label: 'Profiles' },
      { icon: 'shield', value: '100%', label: 'Reviewed' },
    ],
  },
  buscatrans: {
    eyebrow: 'El directorio que te ve como sos', heading: 'Encontrá tu', highlight: 'conexión perfecta.',
    subtitle: 'Perfiles verificados · Discreto · Seguro',
    searchPlaceholder: 'Ciudad o país...',
    pills: ['Todas', 'Buenos Aires', 'Ciudad de México', 'Madrid', 'Lima', 'Bogotá'],
    featuredTitle: 'Perfiles destacados', featuredLink: 'Ver todos',
    citiesTitle: 'Por ciudad', citiesLink: 'Ver mapa',
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
  const [coverMap, setCoverMap] = useState({});
  const [error, setError] = useState(null);

  useScrollReveal([profiles]);

  const canonPath = brand === 'buscatrans' ? '/es/' : '/';
  const lang = brand === 'buscatrans' ? 'es' : 'en';
  const siteName = brand === 'buscatrans' ? 'BuscaTrans' : 'ShemaleWiki';

  useEffect(() => {
    (async () => {
      try {
        // 0. Country detection (timezone + language)
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
          if (!geoCountryName) {
            const nlang = (navigator.language || '').toLowerCase();
            if (nlang.startsWith('nl')) geoCountryName = 'Netherlands';
            else if (nlang.startsWith('es-ar')) geoCountryName = 'Argentina';
          }
        } catch { /* ignore */ }
        if (geoCountryName) setGeoCountry(geoCountryName);

        // Query builder: only methods the PocketBase wrapper supports
        // (select / not / ilike / order / limit). Do NOT use .filter().
        const queryProfiles = async (countryName) => {
          let qb = supabase
            .from('profiles')
            .select('id,name,location,created_at')
            .not('cam_chat', 'eq', 'rejected');
          if (countryName) qb = qb.ilike('location', `%| ${countryName}%`);
          qb = qb.order('created_at', { ascending: false }).limit(40);
          const { data } = await qb;
          return Array.isArray(data) ? data : [];
        };

        let featured = [];
        if (geoCountryName) {
          featured = await queryProfiles(geoCountryName);
        }
        if (featured.length < 12) {
          const global = await queryProfiles(null);
          const have = new Set(featured.map(p => p.id));
          featured = featured.concat(global.filter(p => !have.has(p.id)));
        }
        featured = featured.slice(0, 12);

        // Covers: one photo per profile (prefer local_path='cover')
        if (featured.length) {
          const ids = featured.map(p => p.id);
          const { data: phs } = await supabase
            .from('photos')
            .select('id,profile_id,file,local_path')
            .in('profile_id', ids)
            .limit(500);
          const cmap = {};
          if (Array.isArray(phs)) {
            for (const ph of phs) {
              if (!ph || !ph.file) continue;
              const cur = cmap[ph.profile_id];
              const isCover = (ph.local_path || '') === 'cover';
              if (!cur || (isCover && (cur.local_path || '') !== 'cover')) cmap[ph.profile_id] = ph;
            }
          }
          setCoverMap(cmap);
        }

        setProfiles(featured);
      } catch (err) {
        console.error('Home fetch failed:', err);
        setError(err?.message || 'fetch failed');
      } finally {
        setLoading(false);
      }
    })();
  }, [brand]);

  const getProfileLink = (p) => {
    const parts = (p.location || '').split(' | ');
    const continent = parts[0]?.toLowerCase() || 'europe';
    const country = parts[1]?.toLowerCase() || '';
    const city = parts[parts.length - 1]?.toLowerCase().replace(/\s+/g, '-');
    if (continent && country && city && country !== 'unknown' && city !== 'unknown') {
      return `/${continent}/${country}/${city}`;
    }
    return `/profile/${p.id}`;
  };

  const getProfilePhoto = (p) => {
    const cover = coverMap[p.id];
    if (cover && cover.file) return `https://api.shemalewiki.online/api/files/photos/${cover.id}/${cover.file}`;
    return null;
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
          {content.heading} <span className="highlight">{content.highlight}</span>
        </h1>
        <p className="hero-subtitle">{content.subtitle}</p>

        {brand === 'shemalewiki' && (
          <Link to="/dashboard/login" className="btn btn-trans-dashboard">
            🏳️‍⚧️ If you are trans, click here
          </Link>
        )}

        <div className="search-container">
          <input
            className="search-input"
            type="text"
            aria-label={brand === 'buscatrans' ? 'Buscar perfiles por ciudad o país' : 'Search profiles by city or country'}
            placeholder={content.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const q = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
                window.location.href = brand === 'buscatrans' ? `/es/europe${q}` : `/europe${q}`;
              }
            }}
          />
          <Link to={brand === 'buscatrans' ? '/es/europe' : '/europe'} className="btn btn-primary btn-lg" style={{ textDecoration: 'none' }}>
            <Search size={18} />
            {brand === 'buscatrans' ? 'Buscar' : 'Search'}
            <ArrowRight size={16} style={{ marginLeft: '0.25rem' }} />
          </Link>
        </div>

        <div className="filter-pills" role="group" aria-label={brand === 'buscatrans' ? 'Filtrar por ciudad' : 'Filter by city'}>
          {content.pills.map((pill, i) => {
            const isAll = pill === 'All' || pill === 'Todas';
            const searchTarget = isAll
              ? (brand === 'buscatrans' ? '/es/europe' : '/europe')
              : (brand === 'buscatrans' ? `/es/europe?search=${encodeURIComponent(pill)}` : `/europe?search=${encodeURIComponent(pill)}`);
            return (
              <Link key={pill} to={searchTarget} className={`filter-pill ${i === activePill ? 'active' : ''}`} onClick={() => setActivePill(i)}>
                {pill}
              </Link>
            );
          })}
        </div>

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

      <AdSlot slot="home-top" audience="clients" width={728} height={90} className="ad-top" />

      {/* ── FEATURED ── */}
      <section className="section">
        <div className="section-header">
          <h2>{content.featuredTitle}</h2>
          <Link to="/europe" className="section-link">{content.featuredLink} <ArrowRight size={14} /></Link>
        </div>
        {loading ? (
          <div className="profiles-grid">
            {[...Array(6)].map((_, i) => <div key={i} className="profile-card skeleton" />)}
          </div>
        ) : profiles.length > 0 ? (
          <div className="profiles-grid">
            {profiles.map((p) => {
              const photo = getProfilePhoto(p);
              return (
                <Link key={p.id} to={getProfileLink(p)} className="profile-card">
                  <div className="profile-card-img">
                    {photo ? (
                      <img src={photo} alt={p.name} loading="lazy" />
                    ) : (
                      <div className="no-photo">📷</div>
                    )}
                  </div>
                  <div className="profile-card-info">
                    <h3>{p.name}</h3>
                    <p><MapPin size={12} /> {(p.location || '').split(' | ').slice(-1)[0] || 'Unknown'}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)' }}>
            {error ? 'No se pudieron cargar los perfiles.' : 'No featured profiles available.'}
          </p>
        )}
      </section>

      {/* ── MAP ── */}
      <section className="section">
        <h2>{content.citiesTitle}</h2>
        <WorldMap />
      </section>
    </>
  );
}
