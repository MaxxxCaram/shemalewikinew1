import { useState, useRef, useEffect } from 'react';
import logoSw from '../assets/shemalewiki-blurred-limits.jpg';
import logoBT from '../assets/buscatrans-logo.png';

const STORAGE_KEY = 'sw_age_verified';

export function useAgeVerified() {
  const [verified, setVerified] = useState(() => {
    return sessionStorage.getItem(STORAGE_KEY) === 'true';
  });

  const verify = () => {
    sessionStorage.setItem(STORAGE_KEY, 'true');
    setVerified(true);
  };

  return { verified, verify };
}

const isBT = () => typeof window !== 'undefined' && window.location.hostname.includes('buscatrans');

const t = {
  en: {
    title: 'An invitation for connoisseurs only',
    question: 'Are you 18 years of age or older?',
    accept: 'Enter',
    decline: 'I am under 18',
    welcome: 'Welcome.',
    welcomeSub: 'The doors are open. This is the place where desire burns.',
    welcomeSubSW: 'Step beyond the line. This is where blurred limits begin.',
    denied: 'Access Denied',
    deniedMsg: 'You must be 18 or older to enter.',
    leave: 'Leave this site',
  },
  es: {
    title: 'Una invitación solo para entendidos',
    question: '¿Sos mayor de 18 años?',
    accept: 'Entrar',
    decline: 'Soy menor de 18',
    welcome: 'Bienvenidxs.',
    welcomeSub: 'Las puertas se abren. Este es el lugar donde el deseo arde.',
    welcomeSubSW: 'Cruzá la línea. Acá empiezan los límites difuminados.',
    denied: 'Acceso Denegado',
    deniedMsg: 'Debés ser mayor de 18 años para entrar.',
    leave: 'Salir de este sitio',
  },
};

export default function AgeVerification({ onVerify }) {
  const [phase, setPhase] = useState('gate');
  const videoRef = useRef(null);
  const bt = isBT();
  // El intro es un mp4 de ~2.6MB: en tablet/móvil se muestra el póster estático
  // (no se descarga el video) — la home queda ~2.5MB más liviana y el LCP no se bloquea.
  const [isDesktop, setDesktop] = useState(() => typeof window === 'undefined' || window.innerWidth >= 1024);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const upd = () => setDesktop(mq.matches);
    upd();
    if (mq.addEventListener) { mq.addEventListener('change', upd); return () => mq.removeEventListener('change', upd); }
    return () => {};
  }, []);

  let lang = 'en';
  if (typeof window !== 'undefined') {
    if (bt || window.location.pathname.startsWith('/es') || window.location.pathname.startsWith('/registro')) {
      lang = 'es';
    }
  }
  const txt = t[lang] || t.en;

  const handleAccept = () => {
    setPhase('entering');
    // Short cinematic beat, then enter. Never hold the user 10s on a video
    // that may not load (hosting/format/autoplay-blocked) — that left users
    // stuck on "Welcome" and unable to reach any profile.
    setTimeout(() => {
      onVerify();
    }, 2500);
  };
  const handleDecline = () => setPhase('denied');

  useEffect(() => {
    if (phase === 'entering' && videoRef.current) {
      const v = videoRef.current;
      v.muted = false;
      v.volume = 1.0;
      const p = v.play();
      if (p && p.catch) p.catch(() => {});
    }
  }, [phase]);

  // ── Identity per brand ──
  // BuscaTrans: black/gold/sapphire/emerald jewel + phoenix video
  // ShemaleWiki: obsidian + gold Baccarat + lavender/pink refractions + the blurred-limits woman

  // ENTERING phase
  if (phase === 'entering') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative',
        background: bt
          ? 'radial-gradient(ellipse at center, #1a1505 0%, #0a0a0e 55%, #000000 100%)'
          : 'radial-gradient(ellipse at center, #140c20 0%, #0a0810 55%, #05030a 100%)',
      }}>
        <div style={{
          position: 'absolute', width: '600px', height: '600px', borderRadius: '50%',
          background: bt
            ? 'radial-gradient(circle, rgba(212,175,55,0.25) 0%, transparent 60%)'
            : 'radial-gradient(circle, rgba(212,175,55,0.2) 0%, transparent 60%)',
          filter: 'blur(30px)', animation: 'sw-door-pulse 1.8s ease-in-out infinite',
        }} />
        {!isDesktop ? (
          <img
            src={bt ? '/logos/buscatrans-new-logo.jpg' : '/logos/shemalewiki-blurred-limits.jpg'}
            alt=""
            style={{ width: bt ? '440px' : '620px', maxWidth: '92vw', height: 'auto', borderRadius: '12px',
              boxShadow: bt ? '0 0 50px rgba(212,175,55,0.45)' : '0 0 60px rgba(212,175,55,0.4)',
              animation: (bt ? 'sw-phoenix-flight' : 'sw-blurred-rise') + ' 10s cubic-bezier(0.35, 0.1, 0.25, 1) forwards', zIndex: 2 }}
          />
        ) : bt ? (
          <video
            ref={videoRef}
            src="/logos/buscatrans-logo-intro-web.mp4"
            autoPlay loop playsInline preload="auto"
            style={{ width: '440px', maxWidth: '90vw', height: 'auto', borderRadius: '12px',
              boxShadow: '0 0 50px rgba(212,175,55,0.45)',
              animation: 'sw-phoenix-flight 10s cubic-bezier(0.35, 0.1, 0.25, 1) forwards', zIndex: 2 }}
          />
        ) : (
          <video
            ref={videoRef}
            src="/logos/shemalewiki-intro.mp4"
            autoPlay loop playsInline preload="auto"
            style={{ width: '620px', maxWidth: '92vw', height: 'auto', borderRadius: '12px',
              boxShadow: '0 0 60px rgba(212,175,55,0.4)',
              animation: 'sw-blurred-rise 10s cubic-bezier(0.35, 0.1, 0.25, 1) forwards', zIndex: 2 }}
          />
        )}
        <div style={{ textAlign: 'center', zIndex: 2, marginTop: '1.5rem' }}>
          <h1 style={{
            fontSize: '2.2rem', fontWeight: 800,
            color: bt ? '#d4af37' : '#f0d9a8',
            fontFamily: bt ? "'Playfair Display', serif" : "'Cormorant Garamond', serif",
            letterSpacing: bt ? '0.05em' : '0.08em',
            animation: 'sw-phoenix-caption 2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
          }}>
            {txt.welcome}
          </h1>
          <p style={{
            color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '380px',
            lineHeight: 1.6, fontStyle: 'italic',
            animation: 'sw-phoenix-caption 2.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
          }}>
            {bt ? txt.welcomeSub : txt.welcomeSubSW}
          </p>
        </div>
        <style>{`
          @keyframes sw-door-pulse {
            0%, 100% { opacity: 0.5; transform: scale(0.9); }
            50% { opacity: 1; transform: scale(1.1); }
          }
          @keyframes sw-phoenix-flight {
            0%   { opacity: 0; transform: translateY(80px) scale(0.7); filter: blur(6px); }
            12%  { opacity: 1; transform: translateY(20px) scale(0.92); filter: blur(0); }
            22%  { transform: translateY(0) scale(1); }
            40%  { transform: translateY(-8px) scale(1.03); }
            55%  { transform: translateY(-16px) scale(1.06); }
            70%  { transform: translateY(-26px) scale(1.1); }
            82%  { transform: translateY(-34px) scale(1.14); opacity: 1; }
            92%  { transform: translateY(-40px) scale(1.18); opacity: 0.5; filter: blur(2px); }
            100% { transform: translateY(-60px) scale(1.25); opacity: 0; filter: blur(6px); }
          }
          @keyframes sw-blurred-rise {
            0%   { opacity: 0; transform: translateY(60px) scale(0.8); filter: blur(8px); }
            10%  { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
            20%  { transform: scale(1.02); }
            40%  { transform: scale(1.04); }
            60%  { transform: scale(1.06); }
            75%  { opacity: 1; transform: scale(1.08); }
            88%  { opacity: 0.6; transform: scale(1.1); filter: blur(3px); }
            100% { opacity: 0; transform: scale(1.15) translateY(-20px); filter: blur(8px); }
          }
          @keyframes sw-phoenix-caption {
            0%   { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  // DENIED phase
  if (phase === 'denied') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: bt ? 'linear-gradient(135deg, #0a0a0e 0%, #1a1010 100%)' : 'linear-gradient(135deg, #0a0810 0%, #120d1a 100%)',
        padding: '1rem',
      }}>
        <div style={{
          maxWidth: '420px', width: '100%',
          background: bt ? 'rgba(10,10,14,0.92)' : 'rgba(18,13,26,0.92)',
          backdropFilter: 'blur(20px)', borderRadius: '1.25rem',
          border: bt ? '1px solid rgba(212,175,55,0.35)' : '1px solid rgba(212,175,55,0.28)',
          padding: '2.5rem 2rem', textAlign: 'center',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <img src={bt ? logoBT : logoSw} alt="logo" style={{ height: bt ? '70px' : '90px' }} />
          </div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f87171', marginBottom: '1rem' }}>{txt.denied}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>{txt.deniedMsg}</p>
          <a href="https://www.google.com" target="_blank" rel="noopener noreferrer" style={{
            display: 'inline-block', padding: '0.8rem 2rem', borderRadius: '0.5rem',
            background: 'rgba(255,255,255,0.06)', color: 'var(--text-primary)',
            fontSize: '0.95rem', textDecoration: 'none', fontWeight: 600,
          }}>{txt.leave}</a>
        </div>
      </div>
    );
  }

  // GATE phase
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '1rem', position: 'relative', overflow: 'hidden',
      background: bt
        ? 'radial-gradient(ellipse at center, #1a1505 0%, #0a0a0e 60%, #000000 100%)'
        : 'radial-gradient(ellipse at center, #140c20 0%, #0a0810 60%, #05030a 100%)',
    }}>
      <div style={{
        position: 'absolute', width: '500px', height: '500px', borderRadius: '50%',
        background: bt
          ? 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 60%)'
          : 'radial-gradient(circle, rgba(212,175,55,0.18) 0%, transparent 60%)',
        filter: 'blur(40px)',
      }} />
      <div style={{
        maxWidth: '640px', width: '100%',
        background: bt ? 'rgba(10,10,14,0.92)' : 'rgba(18,13,26,0.92)',
        backdropFilter: 'blur(20px)', borderRadius: '1.5rem',
        border: bt ? '1px solid rgba(212,175,55,0.35)' : '1px solid rgba(212,175,55,0.3)',
        padding: '2.5rem 2.5rem', textAlign: 'center',
        boxShadow: bt ? '0 0 40px rgba(212,175,55,0.25)' : '0 0 40px rgba(212,175,55,0.2)',
        zIndex: 2,
      }}>
        <div style={{ marginBottom: '1rem' }}>
          <img src={bt ? logoBT : logoSw} alt="logo" style={{ height: bt ? '360px' : '320px', width: 'auto' }} />
        </div>
        <h1 style={{
          fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem',
          fontFamily: bt ? "'Playfair Display', serif" : "'Cormorant Garamond', serif",
          letterSpacing: '0.03em',
        }}>
          {txt.title}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '2rem' }}>
          {txt.question}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="button" onClick={handleDecline} style={{
            flex: 1, padding: '0.85rem', borderRadius: '0.5rem',
            border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)',
            color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
          }}>
            {txt.decline}
          </button>
          <button type="button" onClick={handleAccept} style={{
            flex: 1, padding: '0.85rem', borderRadius: '0.5rem', border: 'none',
            background: 'linear-gradient(135deg, #d4af37 0%, #b8860b 50%, #8a5a00 100%)',
            color: '#0a0a0a', fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer',
            textTransform: 'uppercase', letterSpacing: '0.08em',
            boxShadow: '0 4px 20px rgba(212,175,55,0.3)',
          }}>
            {txt.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
