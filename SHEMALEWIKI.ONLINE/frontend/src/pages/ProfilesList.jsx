import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Search, MapPin, ArrowLeft, Building2 } from 'lucide-react';
import { supabase } from '../supabase';
import LazyImage from '../components/LazyImage';
import useScrollReveal from '../useScrollReveal';
import SEO from '../components/SEO';
import AdSlot from '../components/AdSlot';
import { t, getLang } from '../i18n';

// City → slug matching CityGuide.jsx routing
function cityToSlug(city) {
  return city.toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export default function ProfilesList() {
  const { continent, country } = useParams();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [cityCounts, setCityCounts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const lang = getLang();
  const langPrefix = lang === 'en' ? '' : `/${lang}`;

  const displayCountry = country ? country.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : '';

  // Vanguard scroll-reveal for ShemaleWiki cards (re-runs when profiles/cities change)
  useScrollReveal([profiles, cityCounts]);

  // Extract unique cities + profile counts (only profiles WITH photos)
  const fetchCityCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('location, photos(id)')
        .ilike('location', `% | ${displayCountry} |%`)
        .not('cam_chat', 'eq', 'rejected')
        .limit(1000);

      if (error) throw error;

      const arr = Array.isArray(data) ? data : [];
      // Only count profiles that have at least 1 photo
      const withPhotos = arr.filter(p => p.photos && p.photos.length > 0);
      if (!withPhotos.length) return;

      const counts = {};
      withPhotos.forEach(p => {
        const parts = (p.location || '').split(' | ');
        const city = parts[parts.length - 1];
        if (city && city !== 'Unknown') {
          counts[city] = (counts[city] || 0) + 1;
        }
      });

      const sorted = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([city, count]) => ({
          city,
          slug: cityToSlug(city),
          count
        }));

      setCityCounts(sorted);
    } catch (err) {
      console.error('Error fetching city counts:', err);
    }
  };

  const fetchProfiles = async (searchQuery = '') => {
    setLoading(true);
    try {
      let queryBuilder = supabase
        .from('profiles')
        .select('*, photos(photo_url, local_path)')
        .ilike('location', `% | ${displayCountry} |%`)
        .not('cam_chat', 'eq', 'rejected');
        
      if (searchQuery) {
        queryBuilder = queryBuilder.ilike('name', `%${searchQuery}%`);
      }
      // Fetch a larger batch (no created_at ordering) so profiles WITH photos
      // are not pushed out by newer photo-less duplicates.
      const { data, error } = await queryBuilder.order('created_at', { ascending: false }).limit(2000);
      
      if (error) throw error;
      if (data) {
        // Show ONLY profiles with a real, loadable photo — no placeholders.
        const withPhotos = data.map(p => ({ ...p, photos: p.photos || [] }))
          .filter(p => p.photos.some(ph => ph.photo_url && !/web\.archive\.org|shemalewiki\.com/i.test(ph.photo_url)));
        setProfiles(withPhotos);
      }
    } catch (error) {
      console.error("Error fetching profiles", error);
    }
    setLoading(false);
  };

  // Load data once the country changes (functions declared above)
  useEffect(() => {
    fetchProfiles();
    fetchCityCounts();
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
        {t.backTo(continent.charAt(0).toUpperCase() + continent.slice(1))}
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
            {profiles.map((profile, i) => (
              <Link to={`${langPrefix}/profile/${profile.id}`} key={profile.id} className="glass-card profile-card sw-reveal" style={{ '--sw-delay': `${i * 0.05}s` }}>
                <LazyImage
                  src={(profile.photos || []).find(p => p.local_path === 'cover')?.photo_url || profile.photos?.[0]?.photo_url}
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
        </>
      )}
    </div>
    </>
  );
}
