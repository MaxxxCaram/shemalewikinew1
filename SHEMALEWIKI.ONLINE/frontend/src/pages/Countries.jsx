import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';
import { supabase } from '../supabase';
import { paisEs, continenteEs, esEspanol } from '../utils/paisesEs';
import { t, getLang } from '../i18n';

// City slug → country/continent mapping, used to resolve ?search= city pills
// from the home page to the correct city route (e.g. Amsterdam → Europe/Netherlands).
const CITY_ROUTES = {
  amsterdam: { country: 'netherlands', continent: 'europe' },
  'buenos-aires': { country: 'argentina', continent: 'americas' },
  'ciudad-de-mexico': { country: 'mexico', continent: 'americas' },
  madrid: { country: 'spain', continent: 'europe' },
  lima: { country: 'peru', continent: 'americas' },
  bogota: { country: 'colombia', continent: 'americas' },
  london: { country: 'united-kingdom', continent: 'europe' },
  miami: { country: 'united-states', continent: 'americas' },
  'sao-paulo': { country: 'brazil', continent: 'americas' },
  tokyo: { country: 'japan', continent: 'asia' },
  barcelona: { country: 'spain', continent: 'europe' },
  bangkok: { country: 'thailand', continent: 'asia' },
};

export default function Countries() {
  const { continent } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [countries, setCountries] = useState([]);
  const [unknownProfiles, setUnknownProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const lang = getLang();
  const langPrefix = lang === 'en' ? '' : `/${lang}`;

  // Resolve a ?search= city pill to the correct city route.
  useEffect(() => {
    const q = searchParams.get('search');
    if (!q) return;
    const slug = q.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const route = CITY_ROUTES[slug];
    if (route) {
      const target = `${langPrefix}/${route.continent}/${route.country}/${slug}`;
      navigate(target, { replace: true });
    }
  }, [searchParams, langPrefix, navigate]);

  // Capitalize continent name for display and DB query
  const displayContinent = esEspanol() ? continenteEs(continent) : continent.charAt(0).toUpperCase() + continent.slice(1);

  useEffect(() => {
    const fetchCountries = async () => {
      setLoading(true);
      try {
        // Query profiles that start with this continent
        const { data, error } = await supabase
          .from('profiles')
          .select('location')
          .ilike('location', `${displayContinent} |%`);

        if (error) throw error;

        const arr = Array.isArray(data) ? data : [];
        // Extract unique countries
        const countrySet = new Set();
        arr.forEach(p => {
          if (p.location) {
            const parts = p.location.split(' | ');
            if (parts.length >= 2 && parts[1] !== 'Unknown') {
              countrySet.add(parts[1]);
            }
          }
        });

        setCountries(Array.from(countrySet).sort());

        // For "Other" continent: also load profiles WITHOUT photos-filtered list
        // (they have no country, e.g. "Other | Unknown") so they stay reachable.
        if (continent === 'other') {
          const { data: unkData, error: unkErr } = await supabase
            .from('profiles')
            .select('id, name, location, photos(photo_url, local_path)')
            .ilike('location', 'Other |%')
            .not('cam_chat', 'eq', 'rejected')
            .limit(500);
          if (!unkErr && unkData) {
            setUnknownProfiles(unkData.map(p => ({
              ...p,
              photos: p.photos || [],
            })).filter(p => p.photos.length > 0));
          }
        }
      } catch (error) {
        console.error("Error fetching countries", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, [continent, displayContinent]);

  const seoTitle = t.seoCommunityTitle(displayContinent);
  const seoDesc = t.seoCountriesDesc(displayContinent, countries);

  return (
    <>
      <SEO 
        title={seoTitle}
        description={seoDesc}
        canonicalPath={`${langPrefix}/${continent}`}
      />
      <div className="container" style={{ padding: '3rem 0' }}>
        <button 
          onClick={() => navigate(lang === 'en' ? '/' : `/${lang}/`)}
          className="back-btn"
        >
          <ArrowLeft className="back-icon" />
          {t.backToContinents()}
        </button>

        <div className="page-header" style={{ textAlign: 'left', marginBottom: '2.5rem' }}>
          <h1 className="page-title">{t.communityIn(displayContinent)}</h1>
          <p className="page-subtitle">{t.findCompanion()}</p>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        ) : continent === 'other' ? (
          <div>
            {countries.length > 0 && (
              <div className="countries-grid" style={{ marginBottom: '2.5rem' }}>
                {countries.map((country) => (
                  <Link
                    key={country}
                    to={`${langPrefix}/${continent}/${country.toLowerCase()}`}
                    className="country-card"
                  >
                    <div className="country-icon-wrapper">
                      <MapPin className="country-icon" />
                    </div>
                    <span className="country-name">
                      {esEspanol() ? paisEs(country) : country}
                    </span>
                  </Link>
                ))}
              </div>
            )}
            <h2 className="section-title" style={{ fontSize: '1.3rem', marginBottom: '1.25rem' }}>
              {lang === 'nl' ? 'Profielen zonder locatie' : lang === 'fr' ? 'Profils sans localisation' : t.isBT() ? 'Perfiles sin ubicación' : 'Profiles without location'}
            </h2>
            {unknownProfiles.length === 0 ? (
              <div className="empty-state">
                {lang === 'nl' ? 'Er zijn nog geen profielen in dit onderdeel.' : lang === 'fr' ? 'Aucun profil dans cette section pour le moment.' : t.isBT() ? 'Aún no hay perfiles en esta sección.' : 'No profiles in this section yet.'}
              </div>
            ) : (
              <div className="profiles-grid">
                {unknownProfiles.map((p, i) => (
                  <Link to={`${langPrefix}/profile/${p.id}`} key={p.id} className="glass-card profile-card sw-reveal" style={{ '--sw-delay': `${i * 0.05}s`, textDecoration: 'none', color: 'inherit' }}>
                    <img
                      src={(p.photos || []).find(ph => ph.local_path === 'cover')?.photo_url || p.photos?.[0]?.photo_url}
                      alt={p.name}
                      className="profile-card-img"
                      loading="lazy"
                    />
                    <div className="profile-card-content">
                      <h3 className="profile-card-title">{p.name}</h3>
                      <div className="profile-card-meta" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {p.location || 'Unknown'}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : countries.length === 0 ? (
          <div className="empty-state">
            {lang === 'nl' ? `Nog geen profielen gevonden voor ${displayContinent}.` : lang === 'fr' ? `Aucun profil trouvé à ${displayContinent} pour le moment.` : t.isBT() ? `Aún no hay perfiles para ${displayContinent}.` : `No profiles found for ${displayContinent} yet.`}
          </div>
        ) : (
          <div className="countries-grid">
            {countries.map((country) => (
              <Link
                key={country}
                to={`${langPrefix}/${continent}/${country.toLowerCase()}`}
                className="country-card"
              >
                <div className="country-icon-wrapper">
                  <MapPin className="country-icon" />
                </div>
                <span className="country-name">
                  {esEspanol() ? paisEs(country) : country}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
