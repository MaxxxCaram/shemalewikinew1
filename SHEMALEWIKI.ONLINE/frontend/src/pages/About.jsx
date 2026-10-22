import SEO from '../components/SEO';

const isBT = () => typeof window !== 'undefined' && window.location.hostname.includes('buscatrans');

const content = {
  en: {
    seoTitle: 'About Us — Who We Are',
    seoDesc: 'The trans directory made by us, for us: listing is free, your profile is yours, and what you earn is yours. Learn about ShemaleWiki Online, who we help, and how it works.',
    title: 'About ShemaleWiki Online',
    updated: 'Last updated: October 2026',
    quote: '“Identity and money do not always go hand in hand, and one has to choose which battles to fight.” — Maxima Victoria Caram, founder',
    intro: 'The trans directory made by us, for us: listing is free, your profile is yours, and what you earn is yours.',
    long: 'We were born from a wound we know up close: working with your body and identity in a world that needs you but does not protect you. Platforms that change their rules overnight, profiles that disappear, cafetines that turn work into debt. BuscaTrans and ShemaleWiki turn that wound into architecture: a self-managed directory, with verification, multilingual visibility across cities, and a system of collective care that thinks of safety as something we give each other — not as surveillance.',
    behind: 'Behind it is MissNL Productions, from Amsterdam, and years of work in harm reduction, advocacy before the European Parliament and the City of Amsterdam, and the production of international events. We are not just another ad site: we are community infrastructure.',
    sections: [
      {
        h: 'Who we help',
        p: 'The platform has one protagonist and two audiences around her. The narrative always starts with her: trans women who advertise independently — often migrants, moving between cities, who have already tried other platforms and detect lies instantly. That is why we speak to her with truth, with care and with concrete facts, never with inflated promises. Around her: clients and visitors looking for verified profiles, and allied organizations and institutions looking for a serious counterpart with a track record.',
      },
      {
        h: 'What we offer',
        p: 'Every trans woman has the right to be listed for free, with 3 photos, no card and no expiry. Paying is for standing out, not for existing. Profiles are reviewed by a real person — no bots approving blindly. One profile, two markets: you appear on BuscaTrans (Spanish) and ShemaleWiki (English) with a single account. City visibility, full control of your listing (claim, edit, pause or delete whenever you want), and safety tools connected to Vivas: panic button with GPS, check-in/check-out with alerts, travel plan.',
      },
      {
        h: 'What we are not',
        p: 'We are not intermediaries: the contact and the agreement with the client are yours. We do not charge commission per client or per encounter, nor a percentage of what you earn. We do not sell your data or publish anything of yours without your control. We are not a digital cafetín: here there is no debt and no dependence.',
      },
      {
        h: 'How it works',
        p: 'Claim or create your profile — if you already have a listing with public data from your ads, you claim it with a secure link; if not, you create it from scratch. Free. Upload your photos: with 3 photos you are already published. A real person from our team reviews your profile, confirms it is you and that your photos are real, and then your profile goes live in your city. Manage it and, if you want, grow: edit, pause or delete whenever you want. If you want more visibility, move to Perpetual or Arrasando.',
      },
      {
        h: 'How to reach us',
        p: 'For questions, advertising inquiries, or to report an issue with a profile, use our Contact page. We typically respond within 48 hours. Companions who want to update or remove their own profile can write to us and we will act on it.',
      },
    ],
  },
  es: {
    seoTitle: 'Sobre Nosotros — Quiénes Somos',
    seoDesc: 'El directorio trans hecho por nosotras, para nosotras: publicarte es gratis, tu perfil es tuyo y lo que ganás también. Conocé BuscaTrans, a quién ayudamos y cómo funciona.',
    title: 'Sobre BuscaTrans',
    updated: 'Última actualización: octubre 2026',
    quote: '«Identidad y dinero no siempre van de la mano, y una tiene que elegir qué batallas jugar.» — Maxima Victoria Caram, fundadora',
    intro: 'El directorio trans hecho por nosotras, para nosotras: publicarte es gratis, tu perfil es tuyo y lo que ganás también.',
    long: 'Nacimos de una herida que conocemos de cerca: la de trabajar con el cuerpo y la identidad en un mundo que te necesita pero no te protege. Plataformas que cambian sus reglas de un día para el otro, perfiles que desaparecen, cafetines que convierten el trabajo en deuda. BuscaTrans y ShemaleWiki transforman esa herida en arquitectura: un directorio autogestionado, con verificación, visibilidad en varios idiomas y ciudades, y un sistema de cuidado colectivo que piensa la seguridad como algo que nos damos entre nosotras, no como vigilancia.',
    behind: 'Detrás está MissNL Productions, desde Amsterdam, y una trayectoria de años en reducción de daños, incidencia ante el Parlamento Europeo y el Ayuntamiento de Amsterdam, y producción de eventos internacionales. No somos un sitio más de anuncios: somos infraestructura comunitaria.',
    sections: [
      {
        h: 'A quién ayudamos',
        p: 'La plataforma tiene una protagonista y dos públicos que la rodean. La narrativa siempre arranca por ella: mujeres trans que se anuncian de forma independiente — muchas veces migrantes, que se mueven entre ciudades y que ya probaron otras plataformas. Detecta la mentira enseguida. Por eso le hablamos con verdad, con cariño y con datos concretos, nunca con promesas infladas. Alrededor de ella: clientes y visitantes que buscan perfiles verificados, y organizaciones e instituciones aliadas que buscan una contraparte seria y con trayectoria.',
      },
      {
        h: 'Qué ofrecemos',
        p: 'Toda mujer trans tiene derecho a estar publicada gratis, con 3 fotos, sin tarjeta y sin vencimiento. Pagar es para destacarse, no para existir. Los perfiles son revisados por una persona real — nada de bots aprobando a ciegas. Un perfil, dos mercados: aparecés en BuscaTrans (español) y en ShemaleWiki (inglés) con una sola cuenta. Visibilidad por ciudad, control total de tu ficha (reclamar, editar, pausar o borrar cuando quieras), y herramientas de seguridad conectadas a Vivas: botón de pánico con GPS, check-in/check-out con alertas, plan de viaje.',
      },
      {
        h: 'Lo que no somos',
        p: 'No somos intermediarias: el contacto y el acuerdo con el cliente son tuyos. No cobramos comisión por cliente ni por encuentro, ni un porcentaje de lo que ganás. No vendemos tus datos ni publicamos nada tuyo sin tu control. No somos un cafetín digital: acá no hay deuda ni dependencia.',
      },
      {
        h: 'Cómo funciona',
        p: 'Reclamá o creá tu perfil — si ya tenés una ficha con datos públicos de tus anuncios, la reclamás con un enlace seguro; si no, la creás de cero. Gratis. Subí tus fotos: con 3 fotos ya estás publicada. Una persona del equipo revisa tu perfil, confirma que sos vos y que tus fotos son reales, y después tu perfil sale en tu ciudad. Gestioná y, si querés, crecé: editá, pausá o borrá cuando quieras. Si querés más visibilidad, pasate a Perpetuo o Arrasando.',
      },
      {
        h: 'Cómo contactarnos',
        p: 'Para consultas, publicidad o para reportar un problema con un perfil, usá nuestra página de Contacto. Respondemos normalmente dentro de 48 horas. Las acompañantes que quieran actualizar o eliminar su propio perfil pueden escribirnos y lo gestionamos.',
      },
    ],
  },
};

export default function About() {
  const bt = isBT();
  const t = bt ? content.es : content.en;
  const base = bt ? 'https://buscatrans.com' : 'https://shemalewiki.online';

  return (
    <>
      <SEO
        title={t.seoTitle}
        description={t.seoDesc}
        canonicalPath="/about"
        lang={bt ? 'es' : 'en'}
      />
      <div className="container" style={{ maxWidth: '800px', padding: '3rem 1.5rem' }}>
        <h1 className="page-title" style={{ textAlign: 'left', marginBottom: '0.5rem' }}>{t.title}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '2rem' }}>{t.updated}</p>
        <blockquote style={{ borderLeft: '3px solid var(--accent-primary)', paddingLeft: '1rem', margin: '0 0 2rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
          {t.quote}
        </blockquote>
        <p style={{ fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>{t.intro}</p>
        <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{t.long}</p>
        <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: '2rem' }}>{t.behind}</p>
        {t.sections.map((s) => (
          <section key={s.h} style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>{s.h}</h2>
            <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)' }}>{s.p}</p>
          </section>
        ))}
        <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          <a href={`${base}/contact`} style={{ color: 'var(--accent-primary)' }}>
            {bt ? '→ Ir a la página de contacto' : '→ Go to the contact page'}
          </a>
        </p>
      </div>
    </>
  );
}
