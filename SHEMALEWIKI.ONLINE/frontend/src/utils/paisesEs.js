// Traducción de países y continentes para la UI en español (BuscaTrans).
// Los slugs/URLs siguen en inglés (SEO); solo cambia el texto visible.

export const PAISES_ES = {
  'Spain': 'España', 'France': 'Francia', 'Belgium': 'Bélgica',
  'Netherlands': 'Países Bajos', 'Mexico': 'México', 'Germany': 'Alemania',
  'United Kingdom': 'Reino Unido', 'Italy': 'Italia', 'Portugal': 'Portugal',
  'Switzerland': 'Suiza', 'Austria': 'Austria', 'United States': 'Estados Unidos',
  'Brazil': 'Brasil', 'Argentina': 'Argentina', 'Greece': 'Grecia',
  'Denmark': 'Dinamarca', 'Norway': 'Noruega', 'Sweden': 'Suecia',
  'Ireland': 'Irlanda', 'Poland': 'Polonia', 'Czech Republic': 'República Checa',
  'Cyprus': 'Chipre', 'Russia': 'Rusia', 'Ukraine': 'Ucrania',
  'Turkey': 'Turquía', 'Chile': 'Chile', 'Colombia': 'Colombia',
  'Peru': 'Perú', 'Ecuador': 'Ecuador', 'Venezuela': 'Venezuela',
  'Bolivia': 'Bolivia', 'Paraguay': 'Paraguay', 'Uruguay': 'Uruguay',
  'Costa Rica': 'Costa Rica', 'Panama': 'Panamá', 'Guatemala': 'Guatemala',
  'Honduras': 'Honduras', 'Nicaragua': 'Nicaragua', 'El Salvador': 'El Salvador',
  'Dominican Republic': 'República Dominicana', 'Puerto Rico': 'Puerto Rico',
  'Cuba': 'Cuba', 'Japan': 'Japón', 'China': 'China', 'Thailand': 'Tailandia',
  'India': 'India', 'Indonesia': 'Indonesia', 'Philippines': 'Filipinas',
  'Australia': 'Australia', 'New Zealand': 'Nueva Zelanda',
  'Morocco': 'Marruecos', 'Egypt': 'Egipto', 'South Africa': 'Sudáfrica',
  'Israel': 'Israel', 'United Arab Emirates': 'Emiratos Árabes Unidos',
  'Canada': 'Canadá', 'Romania': 'Rumanía', 'Bulgaria': 'Bulgaria',
  'Hungary': 'Hungría', 'Croatia': 'Croacia', 'Serbia': 'Serbia',
  'Slovakia': 'Eslovaquia', 'Slovenia': 'Eslovenia', 'Estonia': 'Estonia',
  'Latvia': 'Letonia', 'Lithuania': 'Lituania', 'Finland': 'Finlandia',
  'Luxembourg': 'Luxemburgo', 'Georgia': 'Georgia', 'Albania': 'Albania',
  'Bosnia y Herzegovina': 'Bosnia y Herzegovina',

  'Albania': 'Albania', 'Andorra': 'Andorra', 'Austria': 'Austria',
  'Belarus': 'Bielorrusia', 'Iceland': 'Islandia', 'Kosovo': 'Kosovo',
  'Malta': 'Malta', 'Moldova': 'Moldavia', 'Montenegro': 'Montenegro',
  'North Macedonia': 'Macedonia del Norte', 'San Marino': 'San Marino',
  'Bosnia': 'Bosnia', 'Monaco': 'Mónaco', 'Liechtenstein': 'Liechtenstein',
  'Iceland': 'Islandia',

};

export const CONTINENTES_ES = {
  'europe': 'Europa', 'americas': 'América', 'asia': 'Asia',
  'africa': 'África', 'oceania': 'Oceanía',
};

// Traduce un nombre de país en inglés a español (o lo devuelve tal cual).
export const paisEs = (name) => PAISES_ES[name] || name;

// Traduce un slug de continente ('europe') a español ('Europa').
export const continenteEs = (slug) => CONTINENTES_ES[slug?.toLowerCase()] || (slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : '');

// Detecta si la UI debe mostrarse en español (brand buscatrans o ruta /es).
export const esEspanol = () =>
  typeof window !== 'undefined' &&
  (window.location.hostname.includes('buscatrans') || window.location.pathname.startsWith('/es'));
