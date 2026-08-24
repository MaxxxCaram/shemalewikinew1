import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import './Guide.css';

const isBT = () => typeof window !== 'undefined' && window.location.hostname.includes('buscatrans');

export default function Guide() {
  const bt = isBT();

  return (
    <div className="guide-page">
      <SEO
        title={bt
          ? "Cómo contratar una acompañante trans de forma segura | BuscaTrans"
          : "How to Hire a Trans Escort Safely — Complete Guide | ShemaleWiki"}
        description={bt
          ? "Guía completa de seguridad para contratar acompañantes trans: verificación de perfiles, consentimiento, pagos seguros, y qué esperar de un encuentro respetuoso."
          : "The complete safety guide for hiring a trans escort: profile verification, consent, secure payment, and what to expect from a respectful encounter."}
        canonicalPath="/guide"
        lang={bt ? 'es' : 'en'}
      />

      <div className="guide-hero">
        <h1>{bt ? 'Cómo contratar una acompañante trans de forma segura' : 'How to Hire a Trans Escort Safely'}</h1>
        <p className="guide-subtitle">
          {bt
            ? 'Una guía honesta sobre verificación, consentimiento y respeto — para que el encuentro sea seguro para ambas personas.'
            : 'An honest guide to verification, consent and respect — so the encounter is safe for both people.'}
        </p>
        <p className="guide-updated">Updated: August 2026 · {bt ? 'Leé también: ' : 'Also read: '}
          <Link to={bt ? '/sobre-nosotros' : '/about'}>{bt ? 'Sobre BuscaTrans' : 'About ShemaleWiki'}</Link>
        </p>
      </div>

      <div className="guide-content">
        <nav className="guide-toc">
          <h2>{bt ? 'Contenido' : 'Contents'}</h2>
          <ol>
            <li><a href="#verify">{bt ? 'Verificá el perfil' : 'Verify the profile'}</a></li>
            <li><a href="#research">{bt ? 'Investigá antes de viajar' : 'Do your research before traveling'}</a></li>
            <li><a href="#payment">{bt ? 'Pagos seguros' : 'Secure payment'}</a></li>
            <li><a href="#consent">{bt ? 'Consentimiento y límites' : 'Consent and boundaries'}</a></li>
            <li><a href="#meeting">{bt ? 'En el encuentro' : 'At the meeting'}</a></li>
            <li><a href="#redflags">{bt ? 'Señales de alerta' : 'Red flags'}</a></li>
            <li><a href="#respect">{bt ? 'Respeto básico' : 'Basic respect'}</a></li>
          </ol>
        </nav>

        <section id="verify">
          <h2>1. {bt ? 'Verificá el perfil' : 'Verify the profile'}</h2>
          <p>
            {bt
              ? 'El primer paso para un encuentro seguro es confirmar que el perfil pertenece a una persona real. En BuscaTrans, cada perfil pasa una revisión manual antes de publicarse, y las trabajadoras pueden reclamar su perfil para verificar su identidad. Buscá perfiles con: fotos reales y consistentes, una descripción detallada, y contacto directo (WhatsApp o Telegram).'
              : 'The first step to a safe encounter is confirming the profile belongs to a real person. On ShemaleWiki, every profile passes a manual review before publication, and workers can claim their profile to verify their identity. Look for profiles with: real, consistent photos; a detailed description; and direct contact (WhatsApp or Telegram).'}
          </p>
          <p>
            {bt
              ? 'Desconfiá de perfiles con fotos de baja calidad que parecen robadas, precios sospechosamente bajos, o que piden depósitos grandes por adelantado sin verificación previa.'
              : 'Be wary of profiles with low-quality photos that look stolen, suspiciously low rates, or requests for large deposits in advance without any prior verification.'}
          </p>
        </section>

        <section id="research">
          <h2>2. {bt ? 'Investigá antes de viajar' : 'Do your research before traveling'}</h2>
          <p>
            {bt
              ? 'Si viajás a otra ciudad o país, investigá la zona antes de confirmar. Buscá el hotel o dirección en mapas, verificá reseñas de la zona, y conocé la legislación local sobre trabajo sexual — en algunos lugares es legal, en otros hay restricciones que pueden afectarte.'
              : 'If you are traveling to another city or country, research the area before confirming. Look up the hotel or address on maps, check reviews of the neighborhood, and know the local laws on sex work — in some places it is legal, in others there are restrictions that can affect you.'}
          </p>
          <p>
            {bt
              ? 'Las guías de ciudad de BuscaTrans incluyen información práctica por destino: zonas, transporte y organizaciones locales de apoyo.'
              : 'ShemaleWiki city guides include practical information per destination: areas, transport, and local support organizations.'}
          </p>
        </section>

        <section id="payment">
          <h2>3. {bt ? 'Pagos seguros' : 'Secure payment'}</h2>
          <ul>
            <li>
              <strong>{bt ? 'Efectivo primero' : 'Cash first'}:</strong>{' '}
              {bt
                ? 'La mayoría de las trabajadoras independientes prefieren efectivo al inicio del encuentro. Es lo más seguro para ambas partes.'
                : 'Most independent workers prefer cash at the start of the encounter. It is the safest for both parties.'}
            </li>
            <li>
              <strong>{bt ? 'Depósitos' : 'Deposits'}:</strong>{' '}
              {bt
                ? 'Un depósito pequeño (10-20%) es normal para confirmar una cita, especialmente con acompañantes de alto nivel. Nunca pagues el 100% por adelantado.'
                : 'A small deposit (10-20%) is normal to confirm an appointment, especially with high-end companions. Never pay 100% in advance.'}
            </li>
            <li>
              <strong>{bt ? 'Sin plataformas no verificadas' : 'No unverified platforms'}:</strong>{' '}
              {bt
                ? 'No envíes pagos por Western Union, tarjetas de regalo, o cripto a alguien que nunca verificaste. Es la estafa más común.'
                : 'Do not send payments via Western Union, gift cards, or crypto to someone you never verified. It is the most common scam.'}
            </li>
          </ul>
        </section>

        <section id="consent">
          <h2>4. {bt ? 'Consentimiento y límites' : 'Consent and boundaries'}</h2>
          <p>
            {bt
              ? 'El consentimiento es la base de todo encuentro. Antes de la cita, aclará qué servicios esperás y confirmá que la trabajadora está de acuerdo. Durante el encuentro, si te piden parar o cambiar algo, respetá sin discusión. El consentimiento puede retirarse en cualquier momento.'
              : 'Consent is the foundation of every encounter. Before the appointment, clarify what services you expect and confirm the worker agrees. During the encounter, if you are asked to stop or change something, respect it without argument. Consent can be withdrawn at any time.'}
          </p>
          <p>
            {bt
              ? 'Llegar con alcohol o drogas a un encuentro, o esperar que la otra persona consuma para "relajarse", es inaceptable. El uso de sustancias nubla el juicio y aumenta los riesgos para ambas personas.'
              : 'Arriving with alcohol or drugs to an encounter, or expecting the other person to use so they "relax", is unacceptable. Substance use clouds judgment and increases risk for both people.'}
          </p>
        </section>

        <section id="meeting">
          <h2>5. {bt ? 'En el encuentro' : 'At the meeting'}</h2>
          <ul>
            <li>
              <strong>{bt ? 'Compartí tu ubicación' : 'Share your location'}:</strong>{' '}
              {bt
                ? 'Avisá a una persona de confianza dónde vas a estar y cuándo esperás volver. La app Vivas, creada por la comunidad, tiene un check-in de seguridad que hace exactamente esto.'
                : 'Tell a trusted person where you will be and when you expect to return. The Vivas app, built by the community, has a safety check-in that does exactly this.'}
            </li>
            <li>
              <strong>{bt ? 'Usá protección' : 'Use protection'}:</strong>{' '}
              {bt
                ? 'Llevá preservativos. Es responsabilidad de ambas personas cuidar la salud.'
                : 'Bring condoms. It is both people\'s responsibility to protect their health.'}
            </li>
            <li>
              <strong>{bt ? 'Confianza en tu instinto' : 'Trust your instinct'}:</strong>{' '}
              {bt
                ? 'Si algo no se siente bien al llegar, no tenés obligación de quedarte. Una trabajadora profesional lo va a entender.'
                : 'If something does not feel right when you arrive, you have no obligation to stay. A professional worker will understand.'}
            </li>
          </ul>
        </section>

        <section id="redflags">
          <h2>6. {bt ? 'Señales de alerta' : 'Red flags'}</h2>
          <ul>
            <li>{bt ? 'Perfiles que piden fotos o videos íntimos "para verificar".' : 'Profiles asking for intimate photos or videos "to verify".'}</li>
            <li>{bt ? 'Precios demasiado buenos para ser reales (más del 50% bajo el promedio de la zona).' : 'Rates too good to be true (more than 50% below the area average).'}</li>
            <li>{bt ? 'Negarse a videollamada o a dar más fotos reales cuando pedís verificar.' : 'Refusing a video call or additional real photos when you ask to verify.'}</li>
            <li>{bt ? 'Presión para pagar todo por adelantado sin depósito parcial ni verificación.' : 'Pressure to pay everything in advance with no partial deposit or verification.'}</li>
            <li>{bt ? 'Direcciones que cambian en el último momento sin explicación clara.' : 'Addresses that change at the last moment with no clear explanation.'}</li>
          </ul>
        </section>

        <section id="respect">
          <h2>7. {bt ? 'Respeto básico' : 'Basic respect'}</h2>
          <p>
            {bt
              ? 'La persona que contratás es una profesional ofreciendo un servicio. Llegá a horario, avisá si te atrasás, pagá lo acordado sin regatear después del hecho, y tratála con la misma cortesía que a cualquier otra persona. El respeto no es un extra — es parte del servicio que estás comprando.'
              : 'The person you hire is a professional offering a service. Arrive on time, let them know if you are running late, pay the agreed amount without haggling after the fact, and treat them with the same courtesy you would anyone else. Respect is not an extra — it is part of the service you are buying.'}
          </p>
          <p>
            {bt
              ? 'Y si algo salió mal, reportalo. Las plataformas serias, como BuscaTrans, investigan los reportes para proteger a su comunidad.'
              : 'And if something went wrong, report it. Serious platforms, like ShemaleWiki, investigate reports to protect their community.'}
          </p>
        </section>

        <div className="guide-cta">
          <h2>{bt ? 'Listo para buscar con confianza' : 'Ready to search with confidence'}</h2>
          <p>
            {bt
              ? 'Explorá perfiles verificados en todo el mundo — cada uno revisado manualmente antes de publicarse.'
              : 'Browse verified profiles worldwide — each one manually reviewed before publication.'}
          </p>
          <Link to={bt ? '/es/europe' : '/europe'} className="btn btn-primary btn-lg">
            {bt ? 'Buscar perfiles →' : 'Browse profiles →'}
          </Link>
        </div>
      </div>
    </div>
  );
}
