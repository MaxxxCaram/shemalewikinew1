import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Component, lazy, Suspense, useState, useEffect } from 'react';
import Home from './pages/Home';
import AgeVerification, { useAgeVerified } from './components/AgeVerification';
import Footer from './components/Footer';

import './index.css';
import logoSw from './assets/shemalewiki-blurred-limits.jpg';
import logoBT from './assets/buscatrans-logo.png';

// Lazy load all pages except Home (critical for first paint)
const Continents = lazy(() => import('./pages/Continents'));
const Countries = lazy(() => import('./pages/Countries'));
const ProfilesList = lazy(() => import('./pages/ProfilesList'));
const Profile = lazy(() => import('./pages/Profile'));
const CityGuide = lazy(() => import('./pages/CityGuide'));
const DashboardLogin = lazy(() => import('./pages/DashboardLogin'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Advertise = lazy(() => import('./pages/Advertise'));
const Register = lazy(() => import('./pages/Register'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Reclama = lazy(() => import('./pages/Reclama'));
const Contact = lazy(() => import('./pages/Contact'));
const About = lazy(() => import('./pages/About'));
const Guide = lazy(() => import('./pages/Guide'));
const Launch = lazy(() => import('./pages/Launch'));
const HarmReduction = lazy(() => import('./pages/HarmReduction'));
const Books = lazy(() => import('./pages/Books'));
const Admin = lazy(() => import('./pages/Admin'));

// Error Boundary: catches render errors (including .forEach on non-arrays)
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg-primary)', color: 'var(--text-primary)',
          textAlign: 'center', padding: '2rem'
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>🤖</h1>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Algo salió mal</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Recargá la página y debería funcionar. Si el error persiste, avisanos.
          </p>
          <button onClick={() => window.location.reload()} className="btn btn-primary">
            Recargar página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ── Domain detection ── */
const isBuscaTrans = () => {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.includes('buscatrans');
};

const getBrand = () => isBuscaTrans() ? 'buscatrans' : 'shemalewiki';

// Apply data-brand to <html> early
if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-brand', getBrand());
}

/* ── Navbar ── */
function Navbar() {
  const bt = isBuscaTrans();
  // Phones: the 4 links + logo + "Descargar App" + "Registrarse" were laid out in one row
  // (~660px), so the logo and both CTAs sat off-screen at 375px. Below 820px the links now
  // collapse behind a toggle (see .nav-toggle in index.css).
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => { setMenuOpen(false); }, [pathname]);
  // Resolve language from URL path so /fr /nl /es /pt /he get localized labels.
  const pathLang = () => {
    if (typeof window === 'undefined') return bt ? 'es' : 'en';
    const p = window.location.pathname;
    if (p.startsWith('/fr')) return 'fr';
    if (p.startsWith('/nl')) return 'nl';
    if (p.startsWith('/es')) return 'es';
    if (p.startsWith('/pt')) return 'pt';
    if (p.startsWith('/he')) return 'he';
    return bt ? 'es' : 'en';
  };
  const lang = pathLang();
  const homeTo = bt ? '/es/' : lang === 'en' ? '/' : `/${lang}/`;

  const navHome =
    lang === 'fr' ? 'Accueil' : lang === 'nl' ? 'Home' : bt ? 'Inicio' : 'Browse';
  const navAdvertise =
    lang === 'fr' ? 'Publier une annonce' : lang === 'nl' ? 'Adverteren' : bt ? 'Anunciar' : 'Advertise';
  const navAbout =
    lang === 'fr' ? 'À propos' : lang === 'nl' ? 'Over ons' : bt ? 'Sobre Nosotros' : 'About';
  const navContact =
    lang === 'fr' ? 'Contact' : lang === 'nl' ? 'Contact' : bt ? 'Contacto' : 'Contact';
  const navRegister =
    lang === 'fr' ? 'Déposer mon profil' : lang === 'nl' ? 'Profiel aanmelden' : bt ? 'Registrarse' : 'List your profile';

  return (
    <nav className={`navbar${menuOpen ? ' nav-open' : ''}`}>
      <div className="container">
        <div className="nav-links nav-left">
          <Link to={homeTo}>{navHome}</Link>
          <Link to={bt ? "/anunciar" : "/advertise"} style={{ color: 'var(--accent-secondary)' }}>{navAdvertise}</Link>
          <Link to={bt ? "/sobre-nosotros" : "/about"}>{navAbout}</Link>
          <Link to={bt ? "/contacto" : "/contact"}>{navContact}</Link>
        </div>
        <Link to={homeTo} className="nav-brand">
          {bt ? (
            <img src={logoBT} alt="BuscaTrans" className="nav-brand-logo" />
          ) : (
            <img src={logoSw} alt="ShemaleWiki Online" className="nav-brand-logo nav-brand-logo-sw" />
          )}
        </Link>
        <button
          type="button"
          className="nav-toggle"
          aria-label={bt || lang === 'es' ? 'Menú' : lang === 'fr' ? 'Menu' : 'Menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className="nav-toggle-bars" aria-hidden="true" />
        </button>
        <div className="nav-links nav-right">
          {bt ? (
            <>
              <a
                href="https://shemalewiki.online/downloads/vivas.apk"
                className="btn btn-download"
                style={{ fontSize: '0.85rem', padding: '0.5rem 1.2rem', marginRight: '0.5rem' }}
              >
                📱 Descargar App
              </a>
              <Link to="/registro" className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1.2rem' }}>
                {navRegister}
              </Link>
            </>
          ) : (
            <Link to="/register" className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1.2rem' }}>
              {navRegister}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

/* ── RootRedirect: buscatrans.com / → /es/ ── */
function RootRedirect() {
  if (isBuscaTrans()) {
    return <Navigate to="/es/" replace />;
  }
  return <Home />;
}

function AppContent() {
  const { verified, verify } = useAgeVerified();
  const isAdminRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
  // Landing/launch is a non-adult promotional page — skip the age gate so the
  // countdown + lead form are immediately visible.
  const isLaunchRoute = typeof window !== 'undefined' &&
    (window.location.pathname === '/launch' || window.location.pathname === '/lanzamiento');

  if (!verified && !isAdminRoute && !isLaunchRoute) {
    return <AgeVerification onVerify={verify} />;
  }

  return (
    <Router>
      <Navbar />
      <main style={{ animation: 'sw-site-reveal 1.2s ease forwards' }}>
      <Suspense fallback={<div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>}>
        <Routes>
          {/* Root: redirects / → /es/ on BuscaTrans, shows Home on ShemaleWiki */}
          <Route path="/" element={<RootRedirect />} />

          {/* Static pages */}
          <Route path="/dashboard/login" element={<DashboardLogin />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/advertise" element={<Advertise />} />
          <Route path="/anunciar" element={<Advertise />} />
          <Route path="/register" element={<Register />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/reclama" element={<Reclama />} />
          <Route path="/es/reclama" element={<Reclama />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/contacto" element={<Contact />} />
          <Route path="/about" element={<About />} />
          <Route path="/sobre-nosotros" element={<About />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="/guia" element={<Guide />} />
          <Route path="/lanzamiento" element={<Launch />} />
          <Route path="/launch" element={<Launch />} />
          <Route path="/guia-reduccion-danos" element={<HarmReduction />} />
          <Route path="/harm-reduction" element={<HarmReduction />} />
          <Route path="/libros" element={<Books />} />
          <Route path="/books" element={<Books />} />
          <Route path="/admin" element={<Admin />} />

          {/* Legacy continent routes */}
          <Route path="/:continent" element={<Countries />} />
          <Route path="/:continent/:country" element={<ProfilesList />} />
          <Route path="/:continent/:country/:city" element={<CityGuide />} />
          <Route path="/profile/:id" element={<Profile />} />

          {/* Language-prefixed routes */}
          <Route path="/en" element={<Continents />} />
          <Route path="/en/:continent" element={<Countries />} />
          <Route path="/en/:continent/:country" element={<ProfilesList />} />
          <Route path="/en/:continent/:country/:city" element={<CityGuide />} />
          <Route path="/en/profile/:id" element={<Profile />} />

          <Route path="/es" element={<Continents />} />
          <Route path="/es/:continent" element={<Countries />} />
          <Route path="/es/:continent/:country" element={<ProfilesList />} />
          <Route path="/es/:continent/:country/:city" element={<CityGuide />} />
          <Route path="/es/profile/:id" element={<Profile />} />

          <Route path="/pt" element={<Continents />} />
          <Route path="/pt/:continent" element={<Countries />} />
          <Route path="/pt/:continent/:country" element={<ProfilesList />} />
          <Route path="/pt/:continent/:country/:city" element={<CityGuide />} />
          <Route path="/pt/profile/:id" element={<Profile />} />

          <Route path="/he" element={<Continents />} />
          <Route path="/he/:continent" element={<Countries />} />
          <Route path="/he/:continent/:country" element={<ProfilesList />} />
          <Route path="/he/:continent/:country/:city" element={<CityGuide />} />
          <Route path="/he/profile/:id" element={<Profile />} />

          <Route path="/nl" element={<Continents />} />
          <Route path="/nl/:continent" element={<Countries />} />
          <Route path="/nl/:continent/:country" element={<ProfilesList />} />
          <Route path="/nl/:continent/:country/:city" element={<CityGuide />} />
          <Route path="/nl/profile/:id" element={<Profile />} />

          <Route path="/fr" element={<Continents />} />
          <Route path="/fr/:continent" element={<Countries />} />
          <Route path="/fr/:continent/:country" element={<ProfilesList />} />
          <Route path="/fr/:continent/:country/:city" element={<CityGuide />} />
          <Route path="/fr/profile/:id" element={<Profile />} />
        </Routes>
        </Suspense>
      </main>
      <Footer />

    </Router>
  );
}

function App() {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;