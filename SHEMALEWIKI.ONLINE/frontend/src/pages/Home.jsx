import { Link } from 'react-router-dom';
import { Search, MapPin, ArrowRight, Sparkles, Globe2, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import SEO from '../components/SEO';
import AdSlot from '../components/AdSlot';
import WorldMap from '../components/WorldMap';
import useScrollReveal from '../useScrollReveal';
import { supabase } from '../supabase';

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
  const [photoMap, setPhotoMap] = useState({});

  useScrollReveal([profiles]);

  const canonPath = brand === 'buscatrans' ? '/es/' : '/';
  const lang = brand === 'buscatrans' ? 'es' : 'en';
  const siteName = brand === 'buscatrans' ? 'BuscaTrans' : 'ShemaleWiki';

  useEffect(() => {
    (async () => {
      try {
        // 0. Detect visitor country client-side
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
        } catch {}
        if (geoCountryName) setGeoCountry(geoCountryName);

        // Fetch profiles WITHOUT expanding photos (much faster)
        const fetchProfiles = async (filter = '', limit = 50) => {
          const { data, error } = await supabase
            .from('profiles')
            .select('id,name,location,created_at')
            .not('cam_chat', 'eq', 'rejected')
            .order('created_at', { ascending: false })
            .filter(filter)
            .limit(limit);
          return Array.isArray(data) ? data : [];
        };

        let featured = [];
        
        // 1. Geo-local profiles
        if (geoCountryName) {
          const filter = `location~'${geoCountryName}'`;
          const local = await fetchProfiles(filter, 50);
          featured = local.slice(0, 12);
          console.log('[Home] geo:', geoCountryName, '| found:', featured.length);
        }

        // 2. Fill with global recents
        if (featured.length < 12) {
          const global = await fetchProfiles('', 50);
          const have = new Set(featured.map(p => p.id));
          const rest = global.filter(p => !have.has(p.id));
          featured = featured.concat(rest.slice(0, 12 - featured.length));
        }

        // Limit to 12
        featured = featured.slice(0, 12);

        // 3. Fetch photos for these 12 profiles only (batch)
        if (featured.length > 0) {
          const ids = featured.map(p => `profile_id='${p.id}'`).join(' || ');
          const { data: photos } = await supabase
            .from('photos')
            .select('id,profile_id,file,photo_url,local_path')
            .filter(ids)
            .limit(500);
          
          const pmap = {};
          if (Array.isArray(photos)) {
            for (const ph of photos) {
              if (!pmap[ph.profile_id]) pmap[ph.profile_id] = [];
              pmap[ph.profile_id].push(ph);
            }
          }
          setPhotoMap(pmap);

          // Mark profiles with verified photo
          for (const p of featured) {
            const phs = pmap[p.id] || [];
            const cover = phs.find(ph => ph.file) || phs[0];
            p._verifiedPhoto = cover ? (brand === 'shemalewiki' ? cover.file : cover.photo_url) : null;
          }
        }

        console.log('[Home] featured final:', featured.length);
        setProfiles(featured);
      } catch (err) {
        console.error('Home fetch failed:', err);
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
    if (p._verifiedPhoto) {
      // If it's a PB file, build the URL
      if (!p._verifiedPhoto.startsWith('http')) {
        const phs = photoMap[p.id] || [];
        const cover = phs.find(ph => ph.file === p._verifiedPhoto);
        if (cover) return `/api/files/photos/${cover.id}/${cover.file}`;
      }
      return p._verifiedPhoto;
    }
    const phs = photoMap[p.id] || [];
    const cover = phs.find(ph => ph.file) || phs[0];
    if (cover && cover.file) return `/api/files/photos/${cover.id}/${cover.file}`;
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

      {/* Featured profiles */}
      <section className="section">
        <div className="section-header">
          <h2>{content.featuredTitle}</h2>
          <Link to="/europe" className="section-link">{content.featuredLink} <ArrowRight size={14} /></Link>
        </div>
        {loading ? (
          <div className="loading-grid">{[...Array(6)].map((_, i) => <div key={i} className="profile-card skeleton" />)}</div>
        ) : profiles.length > 0 ? (
          <div className="profiles-grid">
            {profiles.slice(0, 12).map((p) => {
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
                    <p><MapPin size={12} /> {p.location?.split(' | ').slice(-1)[0] || 'Unknown'}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p>No featured profiles available.</p>
        )}
      </section>

      {/* World Map */}
      <section className="section">
        <h2>{content.citiesTitle}</h2>
        <WorldMap />
      </section>
    </>
  );
}
