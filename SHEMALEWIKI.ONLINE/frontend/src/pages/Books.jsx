import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import './Books.css';

const isBT = () => typeof window !== 'undefined' && window.location.hostname.includes('buscatrans');

export default function Books() {
  const bt = isBT();

  const book = {
    en: {
      title: 'The Sex Worker\'s Sacred Covenant',
      subtitle: 'Wisdom Traditions for Chemsex Safety, Mutual Care & Survival',
      author: 'Maxima Victoria Caram',
      description: 'For decades, sex workers have been criminalized, stigmatized, and left without access to harm reduction resources. The Sex Workers\' Sacred Covenant breaks that silence. This groundbreaking guide combines ancestral wisdom traditions with evidence-based harm reduction practices to create a survival manual for sex workers navigating chemsex environments. Written by a harm reduction advocate with over two decades of experience in sex worker advocacy, this book centers the voices and lived experiences of those most impacted.',
      whatInside: [
        { t: 'Harm Reduction Frameworks', d: 'Practical protocols for substance use safety, health monitoring, and risk mitigation in high-risk environments.' },
        { t: 'Community Care Practices', d: 'Strategies for building mutual aid networks, support systems, and collective protection within sex worker communities.' },
        { t: 'Spiritual & Emotional Resilience', d: 'Wisdom traditions that reclaim power, dignity, and intentionality in work often marked by exploitation.' },
        { t: 'Health Autonomy', d: 'Medical self-advocacy, recognizing exploitation, and navigating healthcare as a criminalized worker.' },
        { t: 'Safety Protocols', d: 'Practical tools for screening clients, setting boundaries, protecting finances, and building emergency response systems.' },
        { t: 'Decriminalization Advocacy', d: 'Understanding how criminalization affects health outcomes and what policy change looks like.' },
      ],
      note: 'This is not a book about "how to use drugs." This is a book about staying alive, building power, and creating community care in systems designed to harm us.',
      aboutAuthor: 'Maxima Victoria Caram is a human rights activist, president of PROUD Nederland, executive director of Miss Star International, and an expert on sex workers\' human rights at the European Parliament.',
      specs: { lang: 'English', year: '2026', pages: '122', format: 'Softcover' },
      buy: 'Buy on Amazon',
      eldor: 'Also at El Dorar',
      reviewsTitle: 'What readers say',
      receptionTitle: 'Community & professional reception',
      receptionIntro: 'Although major commercial platforms often restrict open reviews for content classified as sensitive, the sectors that have reviewed the work highlight the following:',
      receptionItems: [
        { t: 'Harm-reduction activists', d: 'Praise it for breaking institutional silence. It is highly valued that this is not a book written by academics detached from reality, but by someone with over two decades of real grassroots experience.' },
        { t: 'Health & social work professionals', d: 'Specialized critics highlight the manual as an indispensable support tool. They appreciate how it translates complex frameworks (such as those of the WHO and UNODC) into direct, judgment-free language, filling a historic gap in resources for criminalized or stigmatized communities.' },
        { t: 'Independent bookstores', d: 'The book is listed on independent European distribution platforms that bypass traditional automated filters, such as the product page on the Swiss store Eldar Store.' },
        { t: 'Editorial synopses', d: 'The warnings about health autonomy and the five pillars of protection appear in full in the official description provided by the author, available on the Amazon India digital store.' },
      ],
      receptionKeyLabel: 'The readers\' key message',
      receptionKey: 'This is not a book about how to use drugs; it is a book about how to stay alive, build power, and create networks of care in systems designed to harm us.',
      cta: 'Explore the platform',
      featured: 'Featured review',
      reviewSource: 'Verified reader review',
    },
    es: {
      title: 'El Pacto Sagrado de la Trabajadora Sexual',
      subtitle: 'Tradiciones de Sabiduría para la Seguridad en Chemsex, el Cuidado Mutuo y la Supervivencia',
      author: 'Maxima Victoria Caram',
      description: 'Durante décadas, las trabajadoras sexuales han sido criminalizadas, estigmatizadas y dejadas sin acceso a recursos de reducción de daños. El Pacto Sagrado de la Trabajadora Sexual rompe ese silencio. Esta guía revolucionaria combina tradiciones de sabiduría ancestral con prácticas de reducción de daños basadas en evidencia para crear un manual de supervivencia para trabajadoras sexuales que transitan entornos de chemsex. Escrito por una defensora de la reducción de daños con más de dos décadas de experiencia en la defensa de las trabajadoras sexuales, este libro pone el centro en las voces y experiencias vividas de las más afectadas.',
      whatInside: [
        { t: 'Marcos de Reducción de Daños', d: 'Protocolos prácticos para la seguridad en el uso de sustancias, el monitoreo de la salud y la mitigación de riesgos en entornos de alto riesgo.' },
        { t: 'Prácticas de Cuidado Comunitario', d: 'Estrategias para construir redes de ayuda mutua, sistemas de apoyo y protección colectiva dentro de las comunidades de trabajadoras sexuales.' },
        { t: 'Resiliencia Espiritual y Emocional', d: 'Tradiciones de sabiduría que recuperan el poder, la dignidad y la intencionalidad en un trabajo a menudo marcado por la explotación.' },
        { t: 'Autonomía en la Salud', d: 'Autodefensa médica, reconocimiento de la explotación y navegación del sistema de salud como trabajadora criminalizada.' },
        { t: 'Protocolos de Seguridad', d: 'Herramientas prácticas para el tamizaje de clientes, el establecimiento de límites, la protección financiera y la construcción de sistemas de respuesta a emergencias.' },
        { t: 'Defensa de la Despenalización', d: 'Comprender cómo la criminalización afecta los resultados de salud y cómo se ve el cambio de políticas.' },
      ],
      note: 'Este no es un libro sobre "cómo consumir drogas." Es un libro sobre mantenerse viva, construir poder y crear cuidado comunitario en sistemas diseñados para dañarnos.',
      aboutAuthor: 'Maxima Victoria Caram es activista por los derechos humanos, presidenta de PROUD Nederland, directora ejecutiva de Miss Star International y experta en derechos humanos de las trabajadoras sexuales en el Parlamento Europeo.',
      specs: { lang: 'Inglés', year: '2026', pages: '122', format: 'Tapa blanda' },
      buy: 'Comprar en Amazon',
      eldor: 'También en El Dorar',
      reviewsTitle: 'Lo que dicen las lectoras',
      receptionTitle: 'Recepción comunitaria y profesional',
      receptionIntro: 'Aunque las grandes plataformas comerciales suelen restringir los comentarios abiertos para contenido calificado como sensible, los sectores que han revisado la obra destacan lo siguiente:',
      receptionItems: [
        { t: 'Activistas de reducción de daños', d: 'Ha sido elogiado por romper el silencio institucional. Se valora enormemente que no sea un libro escrito por académicos ajenos a la realidad, sino por alguien con más de dos décadas de experiencia real en el activismo de calle.' },
        { t: 'Profesionales de la salud y el trabajo social', d: 'La crítica especializada destaca el manual como una herramienta indispensable de apoyo. Agradecen que traduzca frameworks complejos (como los de la OMS y la UNODC) a un lenguaje directo y libre de juicios morales, llenando un vacío histórico de recursos para comunidades criminalizadas o estigmatizadas.' },
        { t: 'Librerías alternativas e independientes', d: 'La obra está disponible en portales de distribuidoras independientes europeas que esquivan los filtros automatizados tradicionales, como la ficha de producto en la plataforma suiza Eldar Store.' },
        { t: 'Sinopsis editoriales y notas de autor', d: 'Las advertencias sobre la autonomía de la salud y los cinco pilares de protección aparecen de forma íntegra en la descripción oficial proporcionada por la autora, accesible en la tienda digital de Amazon India.' },
      ],
      receptionKeyLabel: 'El mensaje clave de las lectoras',
      receptionKey: 'Este no es un libro sobre cómo usar drogas; es un libro sobre cómo mantenerse vivo, construir poder y crear redes de cuidado en sistemas diseñados para dañarnos.',
      cta: 'Explorar la plataforma',
      featured: 'Reseña destacada',
      reviewSource: 'Reseña verificada de lector/a',
    },
  }[bt ? 'es' : 'en'];

  const amazon = bt
    ? 'https://www.amazon.nl/-/en/dp/B0H5JS6QXM'
    : 'https://www.amazon.nl/-/en/dp/B0H5K5SDYX';

  const eldor = 'https://eldar.ch/buch-produkt/the-sex-workers-sacred-covenant-9798181382190-P36479966';

  const review = {
    es: {
      author: 'Hans',
      date: '13 de agosto de 2026',
      title: '¡Un verdadero pacto!',
      text: 'Es de agradecer que este libro no haya sido escrito por académicos alejados de la realidad, sino por alguien con más de veinte años de experiencia práctica en el activismo de base. Agradecemos que traduzca conceptos complejos (como los de la OMS y la UNODC) a un lenguaje claro y sin juicios, cerrando así una brecha histórica de recursos para comunidades criminalizadas o estigmatizadas. La obra se resume en una frase que describe con precisión su recepción general: «Este no es un libro sobre consumo de drogas; es un libro sobre cómo sobrevivir, ganar poder y construir redes de ayuda en sistemas diseñados para dañarnos».',
    },
    en: {
      author: 'Hans',
      date: 'August 13, 2026',
      title: 'A true covenant!',
      text: 'It is much appreciated that this book was not written by academics detached from reality, but by someone with over twenty years of hands-on experience in grassroots activism. We are grateful that it translates complex concepts (such as those of the WHO and UNODC) into a clear, non-judgmental language, closing a historic gap in resources for criminalized or stigmatized communities. The work can be summed up in one sentence that aptly describes its general reception: "This is not a book about drug use; it is a book about surviving, gaining power, and building support networks in systems designed to harm us."',
    },
  }[bt ? 'es' : 'en'];

  return (
    <div className="books-page">
      <SEO
        title={bt ? 'Libros de Victoria Caram | BuscaTrans' : 'Books by Victoria Caram | ShemaleWiki'}
        description={bt
          ? 'El Pacto Sagrado de la Trabajadora Sexual — tradiciones de sabiduría para la seguridad en chemsex, el cuidado mutuo y la supervivencia. Por Maxima Victoria Caram.'
          : 'The Sex Workers\' Sacred Covenant — wisdom traditions for chemsex safety, mutual care and survival. By Maxima Victoria Caram.'}
        canonicalPath="/libros"
        lang={bt ? 'es' : 'en'}
      />

      <div className="books-header">
        <p className="books-eyebrow">📚 {bt ? 'LIBRERÍA' : 'LIBRARY'}</p>
        <h1>{book.author}</h1>
      </div>

      <div className="books-featured">
        <div className="book-cover-image">
          <img
            src={bt ? '/covers/covenant-cover-ES.png' : '/covers/covenant-cover-EN.png'}
            alt={book.title}
            className="book-cover-img"
          />
        </div>

        <div className="book-info">
          <h2>{book.title}</h2>
          <p className="book-subtitle">{book.subtitle}</p>
          <p className="book-author">{book.author}</p>
          <p className="book-description">{book.description}</p>
          <p className="book-note"><em>{book.note}</em></p>

          <div className="book-specs">
            {Object.entries(book.specs).map(([k, v]) => (
              <span key={k} className="book-spec"><strong>{v}</strong></span>
            ))}
          </div>

          <div className="book-buy">
            <a href={amazon} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg">
              🛒 {book.buy}
            </a>
            <div className="book-alt-links">
              <a href={eldor} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-lg">
                📖 {book.eldor}
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="book-inside">
        <h3>{bt ? 'Qué hay dentro' : 'What\'s inside'}</h3>
        <div className="book-inside-grid">
          {book.whatInside.map((item, i) => (
            <div className="book-inside-item" key={i}>
              <strong>{item.t}</strong>
              <p>{item.d}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="book-about-author">
        <h3>{bt ? 'Sobre la autora' : 'About the author'}</h3>
        <p>{book.aboutAuthor}</p>
      </div>

      <div className="book-reviews">
        <h3>{book.reviewsTitle}</h3>
        <div className="book-review-card">
          <div className="book-review-stars">★★★★★</div>
          <div className="book-review-title">{review.title}</div>
          <p className="book-review-text">{review.text}</p>
          <div className="book-review-meta">
            — {review.author} · {review.date} · <span className="book-review-source">{book.reviewSource}</span>
          </div>
        </div>
      </div>

      <div className="book-reception">
        <h3>{book.receptionTitle}</h3>
        <p className="book-reception-intro">{book.receptionIntro}</p>
        {book.receptionItems.map((item, i) => (
          <div className="book-reception-item" key={i}>
            <strong>{item.t}</strong>
            <p>{item.d}</p>
          </div>
        ))}
        <div className="book-reception-key">
          <strong>{book.receptionKeyLabel}:</strong>
          <p>"{book.receptionKey}"</p>
        </div>
      </div>

      <div className="book-cta">
        <Link to={bt ? '/sobre-nosotros' : '/about'}>{book.cta} →</Link>
      </div>
    </div>
  );
}
