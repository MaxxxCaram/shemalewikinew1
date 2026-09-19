import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Phone, Mail, MessageCircle, MapPin, Globe, Share2, Flag, ChevronLeft, ArrowLeft, Cake, Languages, Ruler, Weight, Sparkles, Camera } from 'lucide-react';
import SEO from '../components/SEO';
import AdSlot from '../components/AdSlot';
import Lightbox from '../components/Lightbox';
import LazyImage from '../components/LazyImage';
import { isLoadablePhoto, hasRealFile } from '../utils/photoFilter';
import { withThumb } from '../utils';
import { supabase } from '../supabase';
import { t, getLang } from '../i18n';

// Per-page labels — language-aware (nl / fr / es / en)
const L = {
  notFound: () => getLang() === 'nl' ? 'Profiel niet gevonden' : getLang() === 'fr' ? 'Profil introuvable' : (t.isBT() ? 'Perfil no encontrado' : 'Profile Not Found'),
  aboutMe: () => getLang() === 'nl' ? 'Over mij' : getLang() === 'fr' ? 'À propos de moi' : (t.isBT() ? 'Sobre mí' : 'About Me'),
  personalFacts: () => getLang() === 'nl' ? 'Persoonlijke gegevens' : getLang() === 'fr' ? 'Informations personnelles' : (t.isBT() ? 'Datos personales' : 'Personal Facts'),
  gallery: () => getLang() === 'nl' ? 'Galerij' : getLang() === 'fr' ? 'Galerie' : (t.isBT() ? 'Galería' : 'Gallery'),
  viewGallery: (n) => getLang() === 'nl'
    ? `🔍 Bekijk galerij · ${n} ${n === 1 ? 'foto' : 'foto\u2019s'}`
    : getLang() === 'fr'
    ? `🔍 Voir la galerie · ${n} ${n === 1 ? 'photo' : 'photos'}`
    : (t.isBT() ? `🔍 Ver Galería · ${n} fotos` : `🔍 View Gallery · ${n} photos`),
  showContact: () => getLang() === 'nl' ? 'Toon contactgegevens' : getLang() === 'fr' ? 'Afficher les coordonnées' : (t.isBT() ? 'Mostrar Contacto' : 'Show Contact Info'),
  facts: {
    nationality: () => getLang() === 'nl' ? 'Nationaliteit' : getLang() === 'fr' ? 'Nationalité' : (t.isBT() ? 'Nacionalidad' : 'Nationality'),
    languages: () => getLang() === 'nl' ? 'Talen' : getLang() === 'fr' ? 'Langues' : (t.isBT() ? 'Idiomas' : 'Languages'),
    age: () => getLang() === 'nl' ? 'Leeftijd' : getLang() === 'fr' ? 'Âge' : (t.isBT() ? 'Edad' : 'Age'),
    height: () => getLang() === 'nl' ? 'Lengte' : getLang() === 'fr' ? 'Taille' : (t.isBT() ? 'Altura' : 'Height'),
    weight: () => getLang() === 'nl' ? 'Gewicht' : getLang() === 'fr' ? 'Poids' : (t.isBT() ? 'Peso' : 'Weight'),
    endowment: () => getLang() === 'nl' ? 'Afmeting' : getLang() === 'fr' ? 'Taille' : (t.isBT() ? 'Dotación' : 'Endowment'),
  },
};

const serviceIcons = {
  'incall': '🏠', 'outcall': '🚗', 'gfe': '💕', 'pse': '⭐',
  'anal': '🍑', 'oral': '👄', 'bdsm': '⛓️', 'fetish': '🎭',
  'massage': '💆', 'kissing': '💋', 'overnight': '🌙',
};

function cityToSlug(city) {
  return city.toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export default function Profile() {
  const { id } = useParams();
  const lang = getLang();
  const langPrefix = lang === 'en' ? '' : `/${lang}`;
  const [profile, setProfile] = useState(null);
  const [similarProfiles, setSimilarProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contactVisible, setContactVisible] = useState(false);
  const [contactData, setContactData] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [toast, setToast] = useState('');
  const nl = getLang() === 'nl';

  useEffect(() => {
    fetchProfile();
    window.scrollTo(0, 0);
  }, [id]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', id).not('cam_chat', 'eq', 'rejected').single();
      if (profileError) throw profileError;
      
      const { data: photos } = await supabase.from('photos').select('id,profile_id,file,photo_url,local_path,collectionId').eq('profile_id', id).limit(20);
      const { data: services } = await supabase.from('services').select('*').eq('profile_id', id).limit(10);
      
      const cleanPhotos = (photos || [])
        .filter(p => isLoadablePhoto(p.photo_url) && hasRealFile(p));
      const hd = cleanPhotos.filter(p => /\.webp$/i.test(p.file || ''));
      const rest = cleanPhotos.filter(p => !/\.webp$/i.test(p.file || ''));
      const ordered = [...hd, ...rest];
      
      setProfile({
        ...profileData,
        photos: ordered,
        services: services || []
      });

      // Fetch similar profiles from same city
      const locParts = (profileData.location || '').split(' | ').map(p => p.trim());
      const city = locParts[locParts.length - 1];
      if (city) {
        const { data: similar } = await supabase
          .from('profiles')
          .select('*, photos(photo_url, local_path)')
          .ilike('location', `% | ${city}`)
          .neq('id', id)
          .limit(4);
        if (similar) {
          setSimilarProfiles(Array.isArray(similar) ? similar.map(p => ({
            ...p,
            photos: (p.photos || []).filter(ph => !(ph.photo_url || '').includes('shemalewiki.com'))
          })).filter(p => p.photos.length > 0) : []);
        }
      }
    } catch (error) {
      console.error("Error fetching profile", error);
      setProfile({ error: true });
    }
    setLoading(false);
  };

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: profile.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setToast('✓ Link copied!');
      setTimeout(() => setToast(''), 3000);
    }
  };

  if (loading) return (
    <div className="container" style={{ padding: '3rem 1rem' }}>
      <div className="profile-skeleton">
        <div className="skeleton-hero" />
        <div className="skeleton-line" style={{width:'60%', marginTop:'1rem'}} />
        <div className="skeleton-line" style={{width:'40%'}} />
      </div>
    </div>
  );
  if (!profile || profile.error) return (
    <div className="container" style={{ textAlign: 'center', marginTop: '4rem', paddingBottom: '4rem' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>😕</h2>
      <h3>{L.notFound()}</h3>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        {lang === 'fr' ? 'Ce profil a peut-être été supprimé ou le lien est incorrect.' : t.isBT() ? 'Este perfil pudo haber sido eliminado o el enlace es incorrecto.' : 'This profile may have been removed or the link is incorrect.'}
      </p>
      <Link to={langPrefix + '/'} className="btn btn-primary">{lang === 'fr' ? 'Retour à l\'accueil' : t.isBT() ? 'Volver al inicio' : 'Back to Home'}</Link>
    </div>
  );

  const locationParts = (profile.location || '').split(' | ').map(p => p.trim());
  const city = locationParts[locationParts.length - 1] || '';
  const country = locationParts[locationParts.length - 2] || '';
  const continent = locationParts.length >= 3 ? locationParts[0].toLowerCase() : '';
  const contMap = { 'europe': 'europe', 'americas': 'americas', 'asia': 'asia', 'oceania': 'oceania', 'africa': 'africa' };
  const contSlug = contMap[continent] || 'europe';
  const countrySlug = country.toLowerCase().replace(/\s+/g, '-');
  const citySlug = cityToSlug(city);

  const seoTitle = `${profile.name} — ${lang === 'fr' ? 'Accompagnante trans à' : lang === 'es' ? 'Acompañante trans en' : 'Trans Companion in'} ${city || country}`;
  const seoDesc = profile.bio 
    ? profile.bio.substring(0, 150).replace(/<[^>]*>/g, '').replace(/"/g, "'").trim() + '...'
    : nl
    ? `${profile.name} — onafhankelijke trans metgezel in ${city}, ${country}. ${profile.age ? `Leeftijd ${profile.age}. ` : ''}Bekijk foto\u2019s, services en geverifieerde contactgegevens.`
    : lang === 'fr'
      ? `${profile.name} — accompagnante trans indépendante à ${city}, ${country}. ${profile.age ? `Âge ${profile.age}. ` : ''}Consultez les photos, les services et les coordonnées vérifiées.`
      : `${profile.name} — independent trans companion in ${city}, ${country}. ${profile.age ? `Age ${profile.age}. ` : ''}View photos, services, and verified contact info.`;

  const seoKeywords = [
    profile.name, `trans companion ${city}`, `ts ${city}`, `shemale ${city}`,
    country ? `trans ${country}` : '', profile.age ? `${profile.age} ${lang === 'fr' ? 'ans' : 'years'}` : ''
  ].filter(Boolean).join(', ');

  const galleryPhotos = profile.photos || [];
  const heroPhoto = galleryPhotos.find(p => p.local_path === 'cover') || galleryPhotos[0];

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    'name': profile.name,
    'description': profile.bio || profile.description,
    'address': { '@type': 'PostalAddress', 'addressLocality': city, 'addressCountry': country },
    'image': heroPhoto?.photo_url,
    ...(profile.age ? { 'birthDate': String(new Date().getFullYear() - Number(profile.age)) } : {})
  };

  return (
    <>
      <SEO 
        title={seoTitle}
        description={seoDesc}
        keywords={seoKeywords}
        canonicalPath={`${langPrefix}/profile/${id}`}
        jsonLd={jsonLd}
      />
      <div className="container" style={{ padding: '1.5rem 0 4rem' }}>
        
        {/* Breadcrumb */}
        <nav className="city-breadcrumb" style={{ marginBottom: '1.5rem' }}>
          <Link to={langPrefix + '/'} className="breadcrumb-link">{lang === 'fr' ? 'Accueil' : 'Home'}</Link>
          <span className="breadcrumb-sep">›</span>
          {continent && country && (
            <>
              <Link to={`/${contSlug}`} className="breadcrumb-link">
                {continent.charAt(0).toUpperCase() + continent.slice(1)}
              </Link>
              <span className="breadcrumb-sep">›</span>
              <Link to={`/${contSlug}/${countrySlug}`} className="breadcrumb-link">
                {country}
              </Link>
            </>
          )}
          {!continent && (
            <Link to={langPrefix + '/'} className="breadcrumb-link">{lang === 'fr' ? 'Annuaire' : nl ? 'Adressengids' : 'Directory'}</Link>
          )}
          <span className="breadcrumb-sep">›</span>
          <span className="breadcrumb-current">{profile.name}</span>
        </nav>

        {/* AD SLOT: clientes (profile) */}
        <AdSlot slot="profile-top" audience="clients" width={728} height={90} className="ad-top" />

        {/* Profile Header — agency-style (vnymodels-inspired) */}
        <div className="profile-header">
          <div className="profile-hero-wrapper"
            onClick={() => heroPhoto && openLightbox(0)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); heroPhoto && openLightbox(0); } }}
            role={heroPhoto ? 'button' : undefined}
            tabIndex={heroPhoto ? 0 : undefined}
            aria-label={heroPhoto ? `View gallery — ${galleryPhotos.length} photos` : 'No photos yet'}
            style={{ cursor: heroPhoto ? 'pointer' : 'default' }}
          >
            <LazyImage 
              src={heroPhoto?.photo_url}
              alt={profile.name}
              className="profile-hero-img"
              eager
            />
            {heroPhoto && (
              <div className="hero-img-overlay">
                <span>{L.viewGallery(galleryPhotos.length)}</span>
              </div>
            )}
            {!heroPhoto && (
              <div className="hero-img-overlay" style={{ opacity: 1 }}>
                <span>{nl ? '📷 Nog geen foto\u2019s' : lang === 'fr' ? '📷 Pas encore de photos' : '📷 No photos yet'}</span>
              </div>
            )}
          </div>

          <div className="profile-info">
            {/* Name + socials */}
            <div className="model-header">
              <h1 className="model-name">
                {profile.name}
              </h1>
              {profile.location && (
                <p className="model-location">
                  <MapPin size={16} /> {profile.location}
                </p>
              )}
            </div>

            {/* Social / action buttons */}
            <div className="model-socials">
              {profile.instagram && typeof profile.instagram === 'string' && profile.instagram !== 'N/A' && (
                <a className="model-social-chip" href={`https://instagram.com/${profile.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer">
                  <Camera size={18} /> {profile.instagram.replace('@','')}
                </a>
              )}
              {profile.onlyfans && typeof profile.onlyfans === 'string' && profile.onlyfans !== 'N/A' && (
                <a className="model-social-chip" href={profile.onlyfans.split(/,\s*/)[0]} target="_blank" rel="noopener noreferrer">
                  <Sparkles size={18} /> OnlyFans
                </a>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, marginLeft: 'auto' }}>
                <button onClick={handleShare} className="icon-btn" title="Share" aria-label="Share profile"
                  style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '50%', width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'var(--transition)' }}>
                  <Share2 size={18} />
                </button>
                <button title="Report" aria-label="Report profile"
                  style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '50%', width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'var(--transition)' }}
                  onClick={() => window.location.href = 'mailto:report@shemalewiki.online?subject=Report+Profile+' + encodeURIComponent(profile.name)}>
                  <Flag size={18} />
                </button>
              </div>
            </div>

            {/* Measurements table — agency style */}
            <div className="model-measurements">
              {profile.age && <div className="model-measure"><span className="model-measure-label">{L.facts.age()}</span><span className="model-measure-value">{profile.age} {lang === 'fr' ? 'ans' : nl ? 'jaar' : t.isBT() ? 'años' : 'yrs'}</span></div>}
              {profile.nationality && <div className="model-measure"><span className="model-measure-label">{L.facts.nationality()}</span><span className="model-measure-value">{profile.nationality}</span></div>}
              {profile.height && <div className="model-measure"><span className="model-measure-label">{L.facts.height()}</span><span className="model-measure-value">{profile.height} cm</span></div>}
              {profile.weight && <div className="model-measure"><span className="model-measure-label">{L.facts.weight()}</span><span className="model-measure-value">{profile.weight} kg</span></div>}
              {profile.languages && <div className="model-measure"><span className="model-measure-label">{L.facts.languages()}</span><span className="model-measure-value">{profile.languages}</span></div>}
              {profile.endowment && profile.endowment !== '?' && <div className="model-measure"><span className="model-measure-label">{L.facts.endowment()}</span><span className="model-measure-value">{profile.endowment}</span></div>}
            </div>

            {/* Services */}
            {profile.services?.filter(s => s.available).length > 0 && (
              <div className="tags-container" style={{ marginBottom: '1.5rem' }}>
                {profile.services.filter(s => s.available).map((service, index) => (
                  <span key={index} className="tag" title={service.service_name}>
                    {serviceIcons[service.service_name?.toLowerCase()] || '✔️'} {service.service_name}
                  </span>
                ))}
              </div>
            )}

            {/* Contact Card */}
            <div className="glass" style={{ padding: '1.75rem', marginBottom: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
              {!contactVisible ? (
                <button 
                  onClick={async () => {
                    setContactVisible(true);
                    try {
                      const r = await fetch(`/api/contact-info?profile_id=${profile.id}`);
                      if (r.ok) setContactData(await r.json());
                      else setContactData({ error: true });
                    } catch { setContactData({ error: true }); }
                  }}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
                >
                  <Phone size={18} />
                  {L.showContact()}
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <h3 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                    {lang === 'fr' ? `Contacter ${profile.name}` : `Contact ${profile.name}`}
                  </h3>
                  {contactData && !contactData.phone && !contactData.whatsapp && !contactData.email && (
                    <div style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Este perfil todavía no muestra contacto. ¿Sos la anfitriona que aparece?</span>
                      <Link to={`/reclama?pid=${profile.id}`} className="btn btn-outline" style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem' }}>
                        🏳️‍⚧️ Reclamalo y cargá tu contacto
                      </Link>
                    </div>
                  )}
                  {contactData?.phone && (
                    <ContactRow icon={<Phone size={18} />} color="#4ade80" label="Phone" value={contactData.phone} href={`tel:${contactData.phone.replace(/\s/g, '')}`} />
                  )}
                  {contactData?.whatsapp && (
                    <ContactRow icon={<MessageCircle size={18} />} color="#25D366" label="WhatsApp" value={contactData.whatsapp}
                      href={`https://wa.me/${contactData.whatsapp.replace(/[\s+()-]/g, '')}`} external />
                  )}
                  {contactData?.email && (
                    <ContactRow icon={<Mail size={18} />} color="#60a5fa" label="Email" value={contactData.email} href={`mailto:${contactData.email}`} />
                  )}
                  {profile.onlyfans && typeof profile.onlyfans === 'string' && profile.onlyfans !== 'N/A' && (() => {
                    const links = profile.onlyfans.split(/,\s*/).filter(Boolean);
                    if (links.length === 1) {
                      const label = links[0].includes('onlyfans.com') ? 'OnlyFans' : 'Video Link';
                      return <ContactRow icon={<Globe size={18} />} color="#f472b6" label={label} value="View" href={links[0]} external />;
                    }
                    return (
                      <div style={{ padding: '0.5rem 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <Globe size={18} color="#f472b6" />
                          <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>🎥 Video Links</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {links.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                              style={{ background: 'rgba(244,114,182,0.1)', border: '1px solid rgba(244,114,182,0.3)', color: '#f472b6', padding: '0.3rem 0.7rem', borderRadius: '0.4rem', fontSize: '0.8rem', textDecoration: 'none' }}>
                              Video {i + 1} ↗
                            </a>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                  {!profile.phone && !profile.whatsapp && !profile.email && !profile.onlyfans && (
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center' }}>
                      {nl ? 'Contactgegevens zijn binnenkort beschikbaar. Kom later terug!' : lang === 'fr' ? 'Les coordonnées arrivent bientôt. Revenez plus tard !' : 'Contact information coming soon. Check back later!'}
                    </p>
                  )}
                  <button 
                    onClick={() => setContactVisible(false)}
                    style={{ 
                      background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)',
                      padding: '0.4rem', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem',
                      marginTop: '0.3rem', transition: 'var(--transition)'
                    }}
                    onMouseOver={e => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.color = 'var(--text-primary)'; }}
                    onMouseOut={e => { e.target.style.borderColor = 'var(--glass-border)'; e.target.style.color = 'var(--text-secondary)'; }}
                  >
                    {nl ? 'Verberg contactgegevens' : lang === 'fr' ? 'Masquer les coordonnées' : 'Hide contact info'}
                  </button>
                </div>
              )}
            </div>

            {/* Bio */}
            {(profile.bio || profile.description) && (
              <div className="profile-bio glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                <h3 style={{ marginTop: 0, marginBottom: '0.75rem', fontSize: '1.15rem', fontWeight: 600, letterSpacing: '-0.02em' }}>{L.aboutMe()}</h3>
                <p style={{ lineHeight: 1.75, whiteSpace: 'pre-line' }}>
                  {profile.bio || profile.description}
                </p>
              </div>
            )}
          </div>
        </div>


        {/* Personal Facts */}
        <section style={{ marginTop: '3.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 600, letterSpacing: '-0.025em' }}>{L.personalFacts()}</h2>
          <div className="facts-grid">
            {[
              { key: 'age', label: L.facts.age(), Icon: Cake, suffix: lang === 'fr' ? ' ans' : t.isBT() ? ' años' : nl ? ' jaar' : ' yrs' },
              { key: 'nationality', label: L.facts.nationality(), Icon: Globe },
              { key: 'languages', label: L.facts.languages(), Icon: Languages },
              { key: 'height', label: L.facts.height(), Icon: Ruler, suffix: ' cm' },
              { key: 'weight', label: L.facts.weight(), Icon: Weight, suffix: ' kg' },
              { key: 'endowment', label: L.facts.endowment(), Icon: Sparkles },
            ].filter(f => profile[f.key]).map(({ key, label, Icon, suffix }) => (
              <div key={key} className="fact-item">
                <div className="fact-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Icon size={14} style={{ opacity: 0.7 }} />
                  {label}
                </div>
                <div className="fact-value">{profile[key]}{suffix ? suffix : ''}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Gallery */}
        {galleryPhotos.length > 1 && (
          <section style={{ marginTop: '3.5rem' }}>
            <div className="section-header" style={{ marginTop: 0, marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.025em' }}>
                {L.gallery()}
              </h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {t.profilesCount(galleryPhotos.length)}
              </span>
            </div>
            <div className="gallery-grid">
              {galleryPhotos.map((photo, index) => (
                <div 
                  key={index}
                  className="gallery-item"
                  onClick={() => openLightbox(index)}
                >
                  <LazyImage 
                    src={withThumb(photo.photo_url, '600x800')}
                    alt={`${profile.name} photo ${index + 1}`}
                    className="gallery-img"
                  />
                  <div className="gallery-item-overlay">
                    <span>🔍</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Similar Profiles */}
        {similarProfiles.length > 0 && (
          <section style={{ marginTop: '3.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '3.5rem' }}>
            <div className="section-header" style={{ marginTop: 0, marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.025em' }}>
                {nl ? `Meer metgezellen in ${city}` : lang === 'fr' ? `Plus d'accompagnantes à ${city}` : `More Companions in ${city}`}
              </h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {lang === 'fr' ? (similarProfiles.length === 1 ? `${similarProfiles.length} profil` : `${similarProfiles.length} profils`) : nl ? (similarProfiles.length === 1 ? 'profiel' : 'profielen') : similarProfiles.length === 1 ? 'profile' : 'profiles'}
              </span>
            </div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
              gap: '1rem' 
            }}>
              {similarProfiles.map(sp => (
                <Link to={`${langPrefix}/profile/${sp.id}`} key={sp.id} className="glass-card profile-card" style={{ textDecoration: 'none' }}>
                  <LazyImage
                    src={(sp.photos || []).find(p => p.local_path === 'cover')?.photo_url || sp.photos?.[0]?.photo_url}
                    alt={sp.name}
                    className="profile-card-img"
                  />
                  <div className="profile-card-gradient" />
                  <div className="profile-card-content">
                    <h3 className="profile-card-title">{sp.name}</h3>
                    <div className="profile-card-meta">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MapPin size={12} /> {sp.location || city}
                      </span>
                      {sp.age && <span>{sp.age} {lang === 'fr' ? 'ans' : nl ? 'jaar' : 'yrs'}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Back to browse */}
        <div style={{ marginTop: '3rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {city && country && (
            <Link to={`${langPrefix}/${contSlug}/${countrySlug}/${citySlug}`} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowLeft size={16} /> {nl ? `Alle metgezellen in ${city}` : lang === 'fr' ? `Toutes les accompagnantes à ${city}` : `All companions in ${city}`}
            </Link>
          )}
          <Link to={langPrefix + '/'} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <ChevronLeft size={16} /> {lang === 'fr' ? 'Accueil' : nl ? 'Home' : 'Home'}
          </Link>
        </div>

      </div>

      {lightboxOpen && (
        <Lightbox
          images={galleryPhotos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onNavigate={setLightboxIndex}
        />
      )}

      {toast && (
        <div role="status" aria-live="polite"
          style={{
            position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
            background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
            color: 'var(--text-primary)', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)',
            zIndex: 9999, fontSize: '0.9rem', backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}
        >
          {toast}
        </div>
      )}
    </>
  );
}

// Contact row component
function ContactRow({ icon, color, value, href, external }) {
  const target = external ? { target: '_blank', rel: 'noreferrer' } : {};
  return (
    <a href={href} {...target}
      style={{ 
        display: 'flex', alignItems: 'center', gap: '0.75rem', 
        color: 'var(--text-primary)', textDecoration: 'none',
        padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)',
        background: 'rgba(255,255,255,0.03)', transition: 'var(--transition)',
        border: '1px solid transparent'
      }}
      onMouseOver={e => { e.target.style.background = 'rgba(255,255,255,0.06)'; e.target.style.borderColor = 'var(--glass-border)'; }}
      onMouseOut={e => { e.target.style.background = 'rgba(255,255,255,0.03)'; e.target.style.borderColor = 'transparent'; }}
    >
      <span style={{ color, flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{value}</span>
    </a>
  );
}
