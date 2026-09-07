import SEO from '../components/SEO';

const isBT = () => typeof window !== 'undefined' && window.location.hostname.includes('buscatrans');

const content = {
  en: {
    seoTitle: 'About Us — Who We Are',
    seoDesc: 'Learn about ShemaleWiki Online: our mission, how profiles are verified, and how to contact us. Free trans companion directory with manually reviewed profiles.',
    title: 'About ShemaleWiki Online',
    updated: 'Last updated: August 2026',
    intro: 'ShemaleWiki Online is a free, independently-run directory of trans companions, escorts and TS models. We rebuilt the directory from the ground up to give verified companions a place to be found — and to give visitors a trustworthy place to look.',
    sections: [
      {
        h: 'Our mission',
        p: 'The trans companion industry is scattered across thousands of small sites, many of them outdated, broken or full of fake listings. We exist to consolidate it into one clean, fast, multilingual directory where every profile you see has been reviewed by a human before going live.',
      },
      {
        h: 'How we verify profiles',
        p: 'Every profile submitted through our registration form is manually checked by our team before publication. We confirm the listing is real, the photos are appropriate, and the contact details are present. Profiles that fail review are rejected or removed. This is why you will never see auto-published listings on ShemaleWiki Online.',
      },
      {
        h: 'Who runs this',
        p: 'ShemaleWiki Online is operated by a small independent team focused on quality and privacy. We do not sell user data and we keep the site free to browse and free to list. A limited number of directly-managed sponsor slots appear on profile and directory pages — curated by us, never resold to ad networks, and clearly labeled.',
      },
      {
        h: 'How to reach us',
        p: 'For questions, advertising inquiries, or to report an issue with a profile, use our Contact page. We typically respond within 48 hours. Companions who want to update or remove their own profile can write to us and we will act on it.',
      },
    ],
  },
  es: {
    seoTitle: 'Sobre Nosotros — Quiénes Somos',
    seoDesc: 'Conocé BuscaTrans: nuestra misión, cómo verificamos los perfiles y cómo contactarnos. Directorio gratuito de acompañantes trans con perfiles revisados manualmente.',
    title: 'Sobre BuscaTrans',
    updated: 'Última actualización: agosto 2026',
    intro: 'BuscaTrans es un directorio gratuito e independiente de acompañantes trans, escorts y modelos TS. Reconstruimos el directorio desde cero para que las acompañantes verificadas tengan un lugar donde ser encontradas — y para que los visitantes tengan un lugar confiable donde buscar.',
    sections: [
      {
        h: 'Nuestra misión',
        p: 'La industria de acompañantes trans está dispersa en miles de sitios pequeños, muchos desactualizados, rotos o llenos de listados falsos. Existimos para consolidarla en un solo directorio limpio, rápido y multilingüe donde cada perfil que ves fue revisado por una persona antes de publicarse.',
      },
      {
        h: 'Cómo verificamos los perfiles',
        p: 'Cada perfil enviado a través de nuestro formulario de registro es revisado manualmente por nuestro equipo antes de publicarse. Confirmamos que el anuncio es real, que las fotos son apropiadas y que los datos de contacto están presentes. Los perfiles que no pasan la revisión son rechazados o eliminados. Por eso nunca verás anuncios auto-publicados en BuscaTrans.',
      },
      {
        h: 'Quiénes lo manejan',
        p: 'BuscaTrans es operado por un equipo independiente pequeño, enfocado en calidad y privacidad. No vendemos datos de usuarios y el sitio es gratis para navegar y publicar. Un número limitado de espacios de auspicio gestionados directamente aparece en las páginas de perfil y directorio — curados por nosotros, nunca revendidos a redes de anuncios, y claramente identificados.',
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
        <p style={{ fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '2rem' }}>{t.intro}</p>
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
