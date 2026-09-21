import { Link } from 'react-router-dom';
import { getLang } from '../i18n';

const isBT = () => typeof window !== 'undefined' && window.location.hostname.includes('buscatrans');

export default function Footer() {
  const bt = isBT();
  const nl = getLang() === 'nl';
  const fr = getLang() === 'fr';
  const langPrefix = nl ? '/nl' : fr ? '/fr' : '';

  const nav = [
    { to: bt ? '/es/' : `${langPrefix}/`, label: bt ? 'Inicio' : fr ? 'Accueil' : nl ? 'Home' : 'Home' },
    { to: bt ? '/anunciar' : '/advertise', label: bt ? 'Anunciar' : fr ? 'Publier une annonce' : nl ? 'Adverteren' : 'Advertise' },
    { to: bt ? '/sobre-nosotros' : '/about', label: bt ? 'Sobre Nosotros' : fr ? 'À propos' : nl ? 'Over ons' : 'About' },
    { to: bt ? '/libros' : '/books', label: bt ? 'Libros de Victoria' : fr ? 'Les livres de Victoria' : nl ? 'Boeken van Victoria' : "Victoria's Books" },
    { to: bt ? '/guia' : '/guide', label: bt ? 'Guía de Seguridad' : fr ? 'Guide de sécurité' : nl ? 'Veiligheidsgids' : 'Safety Guide' },
    { to: bt ? '/lanzamiento' : '/launch', label: bt ? 'Lanzamiento' : fr ? 'Lancement' : nl ? 'Lancering' : 'Launch' },
    { to: bt ? '/contacto' : '/contact', label: bt ? 'Contacto' : fr ? 'Contact' : nl ? 'Contact' : 'Contact' },
    { to: bt ? '/registro' : '/register', label: bt ? 'Registrarse' : fr ? 'Déposer mon profil' : nl ? 'Profiel aanmelden' : 'List your profile' },
  ];

  const continents = [
    { to: `${langPrefix}/europe`, label: bt ? 'Europa' : fr ? 'Europe' : nl ? 'Europa' : 'Europe' },
    { to: `${langPrefix}/americas`, label: bt ? 'Américas' : fr ? 'Amériques' : nl ? 'Amerika' : 'Americas' },
    { to: `${langPrefix}/asia`, label: bt ? 'Asia' : fr ? 'Asie' : nl ? 'Azië' : 'Asia' },
    { to: `${langPrefix}/africa`, label: bt ? 'África' : fr ? 'Afrique' : nl ? 'Afrika' : 'Africa' },
    { to: `${langPrefix}/oceania`, label: bt ? 'Oceanía' : fr ? 'Océanie' : nl ? 'Oceanië' : 'Oceania' },
  ];

  const safety = [
    { href: bt ? '/guia-reduccion-danos' : '/harm-reduction', label: bt ? 'Guía de Reducción de Daños' : fr ? 'Guide de réduction des risques' : nl ? 'Schadebeperkingsgids' : 'Harm Reduction Guide', internal: true },
  ];

  // Terms + Privacy existed but were not linked from anywhere (footer or registration).
  const legal = [
    { to: '/terms', label: bt ? 'Términos y Condiciones' : fr ? 'Conditions générales' : nl ? 'Algemene voorwaarden' : 'Terms & Conditions' },
    { to: '/privacy', label: bt ? 'Política de Privacidad' : fr ? 'Politique de confidentialité' : nl ? 'Privacybeleid' : 'Privacy Policy' },
  ];

  const year = new Date().getFullYear();

  return (
    <footer className="site-footer" style={{
      marginTop: '4rem',
      padding: '3rem 0 2rem',
      borderTop: '1px solid var(--glass-border, rgba(148,163,184,0.15))',
      background: 'rgba(2,6,23,0.4)',
      fontSize: '0.9rem',
    }}>
      <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
        <div>
          <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>
            {bt ? 'BuscaTrans' : 'ShemaleWiki Online'}
          </h4>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.85rem' }}>
            {bt
              ? 'Directorio gratuito de acompañantes trans. Los perfiles nuevos se revisan antes de publicarse.'
              : fr
              ? 'Annuaire gratuit d\'accompagnantes trans. Les nouveaux profils sont relus avant publication.'
              : nl
              ? 'Gratis gids met trans metgezellen. Nieuwe profielen worden gecontroleerd voordat ze worden gepubliceerd.'
              : 'Free directory of trans companions. New profiles are reviewed before publication.'}
          </p>
        </div>
        <div>
          <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>
            {bt ? 'Navegación' : fr ? 'Navigation' : nl ? 'Navigatie' : 'Navigation'}
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {nav.map(l => (
              <li key={l.to} style={{ marginBottom: '0.5rem' }}>
                <Link to={l.to} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>
            {bt ? 'Destinos' : fr ? 'Destinations' : nl ? 'Bestemmingen' : 'Destinations'}
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {continents.map(l => (
              <li key={l.to} style={{ marginBottom: '0.5rem' }}>
                <Link to={l.to} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>
            {bt ? 'Seguridad' : fr ? 'Sécurité' : nl ? 'Veiligheid' : 'Safety Resources'}
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {safety.map(l => (
              <li key={l.href} style={{ marginBottom: '0.5rem' }}>
                {l.internal ? (
                  <Link to={l.href} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>{l.label}</Link>
                ) : (
                  <a href={l.href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>{l.label}</a>
                )}
              </li>
            ))}
          </ul>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0.75rem 0 0' }}>
            {legal.map(l => (
              <li key={l.to} style={{ marginBottom: '0.5rem' }}>
                <Link to={l.to} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>{l.label}</Link>
              </li>
            ))}
          </ul>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.75rem', opacity: 0.7 }}>
            {bt ? 'Contenido solo para mayores de 18 años.' : fr ? 'Contenu réservé aux adultes — 18+.' : nl ? 'Volwassen inhoud — alleen 18+.' : 'Adult content — 18+ only.'}
          </p>
        </div>
      </div>
      <div className="container" style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(148,163,184,0.1)', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', opacity: 0.7 }}>
        © {year} {bt ? 'BuscaTrans — Comunidad de Acompañantes Trans' : fr ? 'ShemaleWiki Online — Annuaire d\'accompagnantes trans' : nl ? 'ShemaleWiki Online — Gids voor Trans Metgezellen' : 'ShemaleWiki Online — Trans Companion Directory'}. {bt ? 'Todos los derechos reservados.' : fr ? 'Tous droits réservés.' : nl ? 'Alle rechten voorbehouden.' : 'All rights reserved.'}
      </div>
    </footer>
  );
}
