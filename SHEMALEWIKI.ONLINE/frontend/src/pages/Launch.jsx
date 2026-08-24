import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import './Launch.css';

const isBT = () => typeof window !== 'undefined' && window.location.hostname.includes('buscatrans');

function getLaunchDate() {
  // Global launch date: 2026-08-21 (same for all visitors).
  return new Date('2026-08-21T00:00:00Z');
}

export default function Launch() {
  const bt = isBT();
  const [timeLeft, setTimeLeft] = useState(null);
  const [role, setRole] = useState('client'); // client | worker
  const [form, setForm] = useState({ name: '', email: '', whatsapp: '' });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const targetRef = useRef(null);

  useEffect(() => {
    targetRef.current = getLaunchDate();
    const tick = () => {
      const diff = targetRef.current - new Date();
      if (diff <= 0) { setTimeLeft({ d: 0, h: 0, m: 0, s: 0 }); return; }
      setTimeLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff / 3600000) % 24),
        m: Math.floor((diff / 60000) % 60),
        s: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email && !form.whatsapp) {
      setError(bt ? 'Ingresá tu email o WhatsApp para avisarte.' : 'Enter your email or WhatsApp so we can notify you.');
      return;
    }
    setStatus('sending');
    setError('');
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role, source: 'launch' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setStatus('done');
    } catch {
      setStatus('error');
      setError(bt ? 'No se pudo guardar. Probá de nuevo.' : 'Could not save. Try again.');
    }
  };

  const L = {
    EN: {
      eyebrow: 'ShemaleWiki · BuscaTrans',
      title1: 'The future of trans',
      title2: 'companionship launches soon.',
      sub: '5,000+ verified profiles, rescued from closed sites. One platform built around safety and respect.',
      countLabel: 'Launching in',
      days: 'days', hours: 'hours', mins: 'mins', secs: 'secs',
      who: 'I am a…',
      client: 'Client / looking to book',
      clientDesc: 'Browse verified trans companions worldwide.',
      worker: 'Companion / sex worker',
      workerDesc: 'Claim your profile + get the Vivas safety app.',
      formTitle: 'Get launch access',
      formSub: 'We\'ll notify you the moment we\'re live.',
      name: 'Your name',
      email: 'Email',
      whatsapp: 'WhatsApp (optional)',
      cta: 'Notify me',
      success: '✅ You\'re on the list. See you at launch!',
      browse: 'Browse profiles now',
      workerNote: 'The Vivas safety app (emergency button, check-in, blacklist) is built for workers — free, always.',
      claim: 'Claim your profile',
    },
    ES: {
      eyebrow: 'ShemaleWiki · BuscaTrans',
      title1: 'El futuro del acompañamiento',
      title2: 'trans está por llegar.',
      sub: 'Más de 5,000 perfiles verificados, rescatados de sitios que cerraron. Una sola plataforma construida alrededor de la seguridad y el respeto.',
      countLabel: 'Lanzamiento en',
      days: 'días', hours: 'horas', mins: 'min', secs: 'seg',
      who: 'Yo soy…',
      client: 'Cliente / busco reservar',
      clientDesc: 'Explorá acompañantes trans verificadas en todo el mundo.',
      worker: 'Acompañante / trabajadora sexual',
      workerDesc: 'Reclamá tu perfil + llevá la app de seguridad Vivas.',
      formTitle: 'Acceso al lanzamiento',
      formSub: 'Te avisamos en cuanto estemos en vivo.',
      name: 'Tu nombre',
      email: 'Email',
      whatsapp: 'WhatsApp (opcional)',
      cta: 'Avisame',
      success: '✅ Estás en la lista. ¡Nos vemos en el lanzamiento!',
      browse: 'Explorar perfiles ahora',
      workerNote: 'La app de seguridad Vivas (botón de emergencia, check-in, blacklist) es para trabajadoras — gratis, siempre.',
      claim: 'Reclamá tu perfil',
    },
  }[bt ? 'ES' : 'EN'];

  return (
    <div className="launch-page">
      <SEO
        title={bt ? 'Lanzamiento próximo — BuscaTrans' : 'Launching Soon — ShemaleWiki'}
        description={bt
          ? 'La primera plataforma de acompañamiento trans construida alrededor de la seguridad. 5,000+ perfiles verificados + app Vivas para trabajadoras.'
          : 'The first trans companionship platform built around safety. 5,000+ verified profiles + the Vivas app for workers.'}
        canonicalPath="/lanzamiento"
        lang={bt ? 'es' : 'en'}
      />

      <div className="launch-hero">
        <p className="launch-eyebrow">{L.eyebrow}</p>
        <h1>{L.title1}<br/><span className="launch-highlight">{L.title2}</span></h1>
        <p className="launch-sub">{L.sub}</p>

        {timeLeft && (
          <div className="launch-countdown">
            <div className="count-label">{L.countLabel}</div>
            <div className="count-grid">
              {[
                { v: timeLeft.d, l: L.days },
                { v: timeLeft.h, l: L.hours },
                { v: timeLeft.m, l: L.mins },
                { v: timeLeft.s, l: L.secs },
              ].map((x, i) => (
                <div className="count-cell" key={i}>
                  <div className="count-num">{String(x.v).padStart(2, '0')}</div>
                  <div className="count-lab">{x.l}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Role selector */}
      <div className="launch-role">
        <div className="role-label">{L.who}</div>
        <div className="role-options">
          <button
            className={`role-option ${role === 'client' ? 'active' : ''}`}
            onClick={() => setRole('client')}
          >
            <span className="role-title">👤 {L.client}</span>
            <span className="role-desc">{L.clientDesc}</span>
          </button>
          <button
            className={`role-option ${role === 'worker' ? 'active' : ''}`}
            onClick={() => setRole('worker')}
          >
            <span className="role-title">💜 {L.worker}</span>
            <span className="role-desc">{L.workerDesc}</span>
          </button>
        </div>
        {role === 'worker' && (
          <p className="role-note">{L.workerNote}</p>
        )}
      </div>

      <div className="launch-form-wrap">
        {status === 'done' ? (
          <div className="launch-success">
            <span className="launch-success-icon">🎉</span>
            <p>{L.success}</p>
          </div>
        ) : (
          <form className="launch-form" onSubmit={submit}>
            <h2>{L.formTitle}</h2>
            <p className="launch-form-sub">{L.formSub}</p>
            <input
              type="text" placeholder={L.name} value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
            <input
              type="email" placeholder={L.email} value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
            <input
              type="tel" placeholder={L.whatsapp} value={form.whatsapp}
              onChange={e => setForm({ ...form, whatsapp: e.target.value })}
            />
            {error && <p className="launch-error">{error}</p>}
            <button type="submit" disabled={status === 'sending'}>
              {status === 'sending' ? '…' : L.cta}
            </button>
          </form>
        )}
        <div className="launch-browse">
          {role === 'worker' ? (
            <Link to={bt ? '/reclama' : '/reclama'}>{L.claim} →</Link>
          ) : (
            <Link to={bt ? '/es/europe' : '/europe'}>{L.browse} →</Link>
          )}
        </div>
      </div>
    </div>
  );
}
