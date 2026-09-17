import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Search, MapPin, ArrowLeft, Building2 } from 'lucide-react';
import { paisEs, continenteEs, esEspanol } from '../utils/paisesEs';
import LazyImage from '../components/LazyImage';
import useScrollReveal from '../useScrollReveal';
import SEO from '../components/SEO';
import AdSlot from '../components/AdSlot';
import { t, getLang } from '../i18n';
import { hasRealFile, isLoadablePhoto } from '../utils/photoFilter';
import { profilePlaceholder } from '../utils';
import { fetchProfilesWithCovers, cityCountsFrom } from '../lib/listing';

// Cover of a card: prefer the pre-computed `_cover` (fast path), then legacy photos.
function pickCover(profile) {
  if (profile && profile._cover) return profile._cover;
  const list = Array.isArray(profile && profile.photos) ? profile.photos : [];
  const byCover = list.find(p => p.local_path === 'cover' && (hasRealFile(p) || (p.photo_url && isLoadablePhoto(p.photo_url))));
  const real = list.find(p => hasRealFile(p));
  const loadable = list.find(p => p.photo_url && isLoadablePhoto(p.photo_url));
  const chosen = byCover || real || loadable || list[0];
  return chosen ? chosen.photo_url : profilePlaceholder(profile && profile.name);
}

const PAGE_SIZE = 48;

export default function ProfilesList() {
  const { continent, country } = useParams();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [cityCounts, setCityCounts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const lang = getLang();
  const langPrefix = lang === 'en' ? '' : `/${lang}`;

  const displayCountryRaw = country ? country.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : '';
  const displayCountry = esEspanol() ? paisEs(displayCountryRaw) : displayCountryRaw;

  // Vanguard scroll-reveal for ShemaleWiki cards (re-runs when profiles/cities change)
  useScrollReveal([profiles, cityCounts]);

  // Extract unique cities + profile counts (only profiles WITH photos)
  // Fetch profiles + covers in 2 light queries (see lib/listing.js).
  // City counts are derived from the same list — no extra round-trips.
  const fetchProfiles = async (searchTerm = '') => {
    setLoading(true);
    try {
      const list = await fetchProfilesWithCovers({
        country: displayCountryRaw,
        search: searchTerm || undefined,
        limit: 3000,
      });
      setProfiles(list);
      if (!searchTerm) setCityCounts(cityCountsFrom(list));
    } catch (error) {
      console.error('Error fetching profiles', error);
      setProfiles([]);
    }
    setLoading(false);
  };

  // Load data once the country changes (functions declared above)
  useEffect(() => {
    setVisible(PAGE_SIZE);
    fetchProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProfiles(searchQuery);
  };

  return (
    <>
      <SEO
        title={t.seoProfilesTitle(displayCountry)}
        description={t.seoProfilesDesc(displayCountry, cityCounts.slice(0, 5).map(c => c.city).join(', '))}
        canonicalPath={`${langPrefix}/${continent}/${country}`}
      />
      <div className="container" style={{ padding: '2rem 0' }}>
      <button 
        onClick={() => navigate(`${langPrefix}/${continent}`)}
        className="back-btn"
      >
        <ArrowLeft className="back-icon" />
        {t.backTo(esEspanol() ? continenteEs(continent) : continent.charAt(0).toUpperCase() + continent.slice(1))}
      </button>

      <div className="page-header" style={{ textAlign: 'left', marginBottom: '2.5rem' }}>
              <h1 className="page-title">{t.communityIn(displayCountry)}</h1>
              <p className="page-subtitle">{t.findCompanion()}</p>
            </div>

            {/* AD SLOT: clientes (country list) */}
            <AdSlot slot="country-top" audience="clients" width={728} height={90} className="ad-top" />

      {/* City cards grid */}
      {cityCounts.length > 0 && (
        <section style={{ marginBottom: '2.5rem' }}>
          <div className="section-header" style={{ marginTop: 0 }}>
            <h2 className="section-title" style={{ fontSize: '1.5rem' }}>
              {t.citiesIn(displayCountry)}
            </h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {t.citiesCount(cityCounts.length)}
            </span>
          </div>
          <div className="countries-grid">
            {cityCounts.map(({ city, slug, count }) => (
              <Link
                key={city}
                to={`${langPrefix}/${continent}/${country}/${slug}`}
                className="glass-card sw-reveal"
                style={{
                  padding: '1.25rem 1.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  textDecoration: 'none',
                  color: 'var(--text-primary)',
                }}
              >
                <span style={{
                  background: 'var(--accent-grad)',
                  borderRadius: '12px',
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 14px rgba(231,192,132,0.25)'
                }}>
                  <Building2 size={18} color="#1a0f0a" />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '1rem', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {city}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', letterSpacing: '-0.01em' }}>
                    {t.profilesCount(count)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="search-container" style={{ marginBottom: '2.5rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', width: '100%', gap: '0.6rem' }}>
          <input 
            type="text" 
            id="searchQuery"
            name="searchQuery"
            className="search-input" 
            placeholder={t.searchPlaceholder()}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            <Search size={18} />
            {t.search()}
          </button>
        </form>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      ) : profiles.length === 0 ? (
        <div className="empty-state">
          {lang === 'nl' ? 'Geen profielen gevonden. Probeer een andere zoekopdracht.' : lang === 'fr' ? 'Aucun profil trouvé. Essayez une autre recherche.' : t.isBT() ? 'No se encontraron perfiles. Probá con otra búsqueda.' : 'No profiles found. Try a different search.'}
        </div>
      ) : (
        <>
          <div className="section-header" style={{ marginTop: 0 }}>
            <h2 className="section-title" style={{ fontSize: '1.5rem' }}>
              {t.profilesAvailable(profiles.length)}
            </h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {t.updatedDaily()}
            </span>
          </div>
          <div className="profiles-grid">
            {profiles.slice(0, visible).map((profile, i) => (
              <Link to={`${langPrefix}/profile/${profile.id}`} key={profile.id} className="glass-card profile-card sw-reveal" style={{ '--sw-delay': `${(i % PAGE_SIZE) * 0.05}s` }}>
                <LazyImage
                  src={pickCover(profile)}
                  alt={profile.name}
                  className="profile-card-img"
                />
                <div className="profile-card-gradient" />
                <div className="profile-card-content">
                  <h3 className="profile-card-title">{profile.name}</h3>
                  <div className="profile-card-meta">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <MapPin size={14} /> {profile.location || 'Unknown'}
                    </span>
                    {profile.age && <span>🎂 {profile.age} {lang === 'nl' ? 'jaar' : lang === 'fr' ? 'ans' : lang === 'es' ? 'años' : 'years'}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {visible < profiles.length && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <button
                className="btn btn-primary"
                onClick={() => setVisible(v => v + PAGE_SIZE)}
              >
                {lang === 'es' ? 'Ver más' : lang === 'nl' ? 'Meer laden' : lang === 'fr' ? 'Voir plus' : 'Load more'}
                {' '}({profiles.length - visible})
              </button>
            </div>
          )}
        </>
      )}
    </div>
    </>
  );
}
