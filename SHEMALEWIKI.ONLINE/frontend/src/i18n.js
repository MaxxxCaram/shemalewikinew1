// Lightweight brand/language helper for BuscaTrans (es) vs ShemaleWiki (en),
// with optional language-prefixed routes (/es /pt /fr /he) on either brand.
// No full i18n framework — just the strings that matter for brand coherence.

const isBuscaTrans = () =>
  typeof window !== 'undefined' && window.location.hostname.includes('buscatrans');

// Resolve the active language from the URL path prefix, then brand, then default.
export const getLang = () => {
  if (typeof window === 'undefined') return 'en';
  const p = window.location.pathname;
  if (p.startsWith('/fr')) return 'fr';
  if (p.startsWith('/nl')) return 'nl';
  if (p.startsWith('/es')) return 'es';
  if (p.startsWith('/pt')) return 'pt';
  if (p.startsWith('/he')) return 'he';
  if (isBuscaTrans()) return 'es';
  return 'en';
};

// Language dictionaries
const S = {
  en: {
    backTo: (name) => `Back to ${name}`,
    backToContinents: () => 'Back to Continents',
    communityIn: (place) => `Community in ${place}`,
    citiesIn: (place) => `Cities in ${place}`,
    transCommunityIn: (place) => `Trans Community in ${place}`,
    findCompanion: () => 'Find the perfect companion',
    updatedDaily: () => 'Updated daily',
    profilesAvailable: (n) => `${n} Profile${n === 1 ? '' : 's'} available`,
    citiesCount: (n) => `${n} cit${n === 1 ? 'y' : 'ies'}`,
    profilesCount: (n) => `${n} profile${n === 1 ? '' : 's'}`,
    searchPlaceholder: () => 'Search by name, location, or keywords...',
    search: () => 'Search',
    seoProfilesTitle: (country) => `Trans Companions in ${country}`,
    seoProfilesDesc: (country, cityNames) =>
      `Find trans companions and TS escorts in ${country}. Browse ${cityNames}. Profiles updated daily.`,
    seoCommunityTitle: (continent) => `Trans Community in ${continent}`,
    seoCountriesDesc: (continent, countries) =>
      `Find trans companions and profiles in ${continent}. Browse by country — ${countries.slice(0, 10).join(', ')}${countries.length > 10 ? ' and more' : ''}.`,
  },
  es: {
    backTo: (name) => `Volver a ${name}`,
    backToContinents: () => 'Volver a Continentes',
    communityIn: (place) => `Comunidad en ${place}`,
    citiesIn: (place) => `Ciudades en ${place}`,
    transCommunityIn: (place) => `Comunidad Trans en ${place}`,
    findCompanion: () =>
      'Encontrá la compañía perfecta',
    updatedDaily: () => 'Actualizado a diario',
    profilesAvailable: (n) => `${n} perfiles disponibles`,
    citiesCount: (n) => `${n} ciudades`,
    profilesCount: (n) => `${n} perfiles`,
    searchPlaceholder: () =>
      'Buscar por nombre, ubicación o palabras clave...',
    search: () => 'Buscar',
    seoProfilesTitle: (country) =>
      `Acompañantes Trans en ${country}`,
    seoProfilesDesc: (country, cityNames) =>
      `Encontrá acompañantes trans en ${country}. Explorá ${cityNames}. Perfiles actualizados a diario.`,
    seoCommunityTitle: (continent) => `Comunidad Trans en ${continent}`,
    seoCountriesDesc: (continent, countries) =>
      `Encontrá acompañantes trans y perfiles en ${continent}. Explorá por país — ${countries.slice(0, 10).join(', ')}${countries.length > 10 ? ' y más' : ''}.`,
  },
  pt: {
    backTo: (name) => `Voltar para ${name}`,
    backToContinents: () => 'Voltar para Continentes',
    communityIn: (place) => `Comunidade em ${place}`,
    citiesIn: (place) => `Cidades em ${place}`,
    transCommunityIn: (place) => `Comunidade Trans em ${place}`,
    findCompanion: () =>
      'Encontre a companhia perfeita',
    updatedDaily: () => 'Atualizado diariamente',
    profilesAvailable: (n) => `${n} perfis disponíveis`,
    citiesCount: (n) => `${n} cidades`,
    profilesCount: (n) => `${n} perfis`,
    searchPlaceholder: () =>
      'Pesquisar por nome, localização ou palavras-chave...',
    search: () => 'Buscar',
    seoProfilesTitle: (country) => `Acompanhantes Trans em ${country}`,
    seoProfilesDesc: (country, cityNames) =>
      `Encontre acompanhantes trans em ${country}. Explore ${cityNames}. Perfis atualizados diariamente.`,
    seoCommunityTitle: (continent) => `Comunidade Trans em ${continent}`,
    seoCountriesDesc: (continent, countries) =>
      `Encontre acompanhantes trans e perfis em ${continent}. Explore por país — ${countries.slice(0, 10).join(', ')}${countries.length > 10 ? ' e mais' : ''}.`,
  },
  fr: {
    backTo: (name) => `Retour à ${name}`,
    backToContinents: () => 'Retour aux continents',
    communityIn: (place) => `Communauté à ${place}`,
    citiesIn: (place) => `Villes à ${place}`,
    transCommunityIn: (place) => `Communauté trans à ${place}`,
    findCompanion: () =>
      'Trouvez la compagnie parfaite',
    updatedDaily: () => 'Mis à jour chaque jour',
    profilesAvailable: (n) =>
      `${n} profil${n > 1 ? 's' : ''} disponible${n > 1 ? 's' : ''}`,
    citiesCount: (n) => `${n} ville${n > 1 ? 's' : ''}`,
    profilesCount: (n) => `${n} profil${n > 1 ? 's' : ''}`,
    searchPlaceholder: () =>
      'Rechercher par nom, lieu ou mots-clés...',
    search: () => 'Rechercher',
    seoProfilesTitle: (country) => `Accompagnantes trans à ${country}`,
    seoProfilesDesc: (country, cityNames) =>
      `Trouvez des accompagnantes trans à ${country}. Parcourez ${cityNames}. Profils mis à jour chaque jour.`,
    seoCommunityTitle: (continent) => `Communauté trans à ${continent}`,
    seoCountriesDesc: (continent, countries) =>
      `Trouvez des accompagnantes trans et des profils à ${continent}. Parcourez par pays — ${countries.slice(0, 10).join(', ')}${countries.length > 10 ? ' et plus' : ''}.`,
  },
  he: {
    backTo: (name) => `חזרה ל${name}`,
    backToContinents: () => 'חזרה ליבשות',
    communityIn: (place) => `הקהילה ב${place}`,
    citiesIn: (place) => `ערים ב${place}`,
    transCommunityIn: (place) => `הקהילה הטרנסית ב${place}`,
    findCompanion: () => 'מצאו את החברה המושלמת',
    updatedDaily: () => 'מתעדכן מדי יום',
    profilesAvailable: (n) => `${n} פרופילים זמינים`,
    citiesCount: (n) => `${n} ערים`,
    profilesCount: (n) => `${n} פרופילים`,
    searchPlaceholder: () => 'חיפוש לפי שם, מיקום או מילות מפתח...',
    search: () => 'חיפוש',
    seoProfilesTitle: (country) => `מלוות טרנסיות ב${country}`,
    seoProfilesDesc: (country, cityNames) =>
      `מצאו מלוות טרנסיות ב${country}. עיינו ב${cityNames}. פרופילים מתעדכנים מדי יום.`,
    seoCommunityTitle: (continent) => `הקהילה הטרנסית ב${continent}`,
    seoCountriesDesc: (continent, countries) =>
      `מצאו מלוות טרנסיות ופרופילים ב${continent}. עיינו לפי מדינה — ${countries.slice(0, 10).join(', ')}${countries.length > 10 ? ' ועוד' : ''}.`,
  },
  nl: {
    backTo: (name) => `Terug naar ${name}`,
    backToContinents: () => 'Terug naar Continenten',
    communityIn: (place) => `Gemeenschap in ${place}`,
    citiesIn: (place) => `Steden in ${place}`,
    transCommunityIn: (place) => `Transgemeenschap in ${place}`,
    findCompanion: () => 'Vind de perfecte metgezel',
    updatedDaily: () => 'Dagelijks bijgewerkt',
    profilesAvailable: (n) => `${n} ${n === 1 ? 'profiel beschikbaar' : 'profielen beschikbaar'}`,
    citiesCount: (n) => `${n} ${n === 1 ? 'stad' : 'steden'}`,
    profilesCount: (n) => `${n} ${n === 1 ? 'profiel' : 'profielen'}`,
    searchPlaceholder: () => 'Zoek op naam, locatie of trefwoorden...',
    search: () => 'Zoeken',
    seoProfilesTitle: (country) => `Trans Metgezellen in ${country}`,
    seoProfilesDesc: (country, cityNames) =>
      `Vind trans metgezellen en TS escorts in ${country}. Blader door ${cityNames}. Profielen dagelijks bijgewerkt.`,
    seoCommunityTitle: (continent) => `Transgemeenschap in ${continent}`,
    seoCountriesDesc: (continent, countries) =>
      `Vind trans metgezellen en profielen in ${continent}. Blader per land — ${countries.slice(0, 10).join(', ')}${countries.length > 10 ? ' en meer' : ''}.`,
  },
};

const dict = (key, ...args) => (S[getLang()] || S.en)[key](...args);

export const t = {
  isBT: () => isBuscaTrans(),
  lang: () => getLang(),

  // Navigation
  backTo: (name) => dict('backTo', name),
  backToContinents: () => dict('backToContinents'),

  // Headings
  communityIn: (place) => dict('communityIn', place),
  citiesIn: (place) => dict('citiesIn', place),
  transCommunityIn: (place) => dict('transCommunityIn', place),

  // Subtitles
  findCompanion: () => dict('findCompanion'),
  updatedDaily: () => dict('updatedDaily'),

  // Counts
  profilesAvailable: (n) => dict('profilesAvailable', n),
  citiesCount: (n) => dict('citiesCount', n),
  profilesCount: (n) => dict('profilesCount', n),

  // Search
  searchPlaceholder: () => dict('searchPlaceholder'),
  search: () => dict('search'),

  // SEO
  seoProfilesTitle: (country) => dict('seoProfilesTitle', country),
  seoProfilesDesc: (country, cityNames) => dict('seoProfilesDesc', country, cityNames),
  seoCommunityTitle: (continent) => dict('seoCommunityTitle', continent),
  seoCountriesDesc: (continent, countries) => dict('seoCountriesDesc', continent, countries),
};
