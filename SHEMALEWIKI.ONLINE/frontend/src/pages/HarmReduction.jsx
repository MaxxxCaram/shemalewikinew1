import { useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import './HarmReduction.css';

const isBT = () => typeof window !== 'undefined' && window.location.hostname.includes('buscatrans');

// Interaction matrix — based on verified harm-reduction data (TripSit/AHF consensus).
// status: safe | caution | danger | unsafe | unknown
const SUBSTANCES = [
  { id: 'alcohol', en: 'Alcohol', es: 'Alcohol', emoji: '🍺' },
  { id: 'weed', en: 'Cannabis', es: 'Cannabis', emoji: '🌿' },
  { id: 'cocaine', en: 'Cocaine', es: 'Cocaína', emoji: '❄️' },
  { id: 'mdma', en: 'MDMA', es: 'MDMA', emoji: '💊' },
  { id: 'ketamine', en: 'Ketamine', es: 'Ketamina', emoji: '🐴' },
  { id: 'ghb', en: 'GHB / GBL', es: 'GHB / GBL', emoji: '💧' },
  { id: 'meth', en: 'Methamphetamine', es: 'Metanfetamina', emoji: '💎' },
  { id: 'benzos', en: 'Benzodiazepines', es: 'Benzodiacepinas', emoji: '💤' },
  { id: 'poppers', en: 'Poppers', es: 'Poppers', emoji: '🫙' },
  { id: 'viagra', en: 'Viagra / PDE5', es: 'Viagra / PDE5', emoji: '🩸' },
  { id: 'lsd', en: 'LSD', es: 'LSD', emoji: '🌀' },
  { id: 'mushrooms', en: 'Mushrooms', es: 'Hongos', emoji: '🍄' },
];

// interaction: [substanceA, substanceB, status]
const INTERACTIONS = [
  ['alcohol', 'cocaine', 'danger'],
  ['alcohol', 'ghb', 'unsafe'],
  ['alcohol', 'benzos', 'unsafe'],
  ['alcohol', 'mdma', 'caution'],
  ['alcohol', 'ketamine', 'caution'],
  ['alcohol', 'weed', 'caution'],
  ['alcohol', 'meth', 'danger'],
  ['cocaine', 'mdma', 'danger'],
  ['cocaine', 'meth', 'unsafe'],
  ['cocaine', 'ghb', 'danger'],
  ['cocaine', 'benzos', 'danger'],
  ['cocaine', 'poppers', 'danger'],
  ['cocaine', 'viagra', 'danger'],
  ['cocaine', 'alcohol', 'danger'],
  ['mdma', 'cocaine', 'danger'],
  ['mdma', 'meth', 'danger'],
  ['mdma', 'ghb', 'caution'],
  ['mdma', 'ketamine', 'caution'],
  ['mdma', 'benzos', 'danger'],
  ['mdma', 'weed', 'caution'],
  ['mdma', 'alcohol', 'caution'],
  ['mdma', 'viagra', 'danger'],
  ['ghb', 'alcohol', 'unsafe'],
  ['ghb', 'benzos', 'unsafe'],
  ['ghb', 'cocaine', 'danger'],
  ['ghb', 'meth', 'danger'],
  ['ghb', 'ketamine', 'danger'],
  ['ghb', 'weed', 'unknown'],
  ['ghb', 'mdma', 'caution'],
  ['meth', 'cocaine', 'unsafe'],
  ['meth', 'mdma', 'danger'],
  ['meth', 'viagra', 'danger'],
  ['meth', 'benzos', 'danger'],
  ['meth', 'ghb', 'danger'],
  ['meth', 'ketamine', 'caution'],
  ['meth', 'alcohol', 'danger'],
  ['meth', 'poppers', 'danger'],
  ['benzos', 'alcohol', 'unsafe'],
  ['benzos', 'ghb', 'unsafe'],
  ['benzos', 'cocaine', 'danger'],
  ['benzos', 'mdma', 'danger'],
  ['benzos', 'meth', 'danger'],
  ['benzos', 'opioids', 'unsafe'],
  ['poppers', 'viagra', 'unsafe'],
  ['poppers', 'cocaine', 'danger'],
  ['poppers', 'meth', 'danger'],
  ['viagra', 'poppers', 'unsafe'],
  ['viagra', 'cocaine', 'danger'],
  ['viagra', 'meth', 'danger'],
  ['viagra', 'mdma', 'danger'],
  ['ketamine', 'alcohol', 'caution'],
  ['ketamine', 'ghb', 'danger'],
  ['ketamine', 'meth', 'caution'],
  ['ketamine', 'mdma', 'caution'],
  ['ketamine', 'benzos', 'danger'],
  ['ketamine', 'weed', 'safe'],
  ['lsd', 'mushrooms', 'safe'],
  ['lsd', 'weed', 'caution'],
  ['lsd', 'mdma', 'caution'],
  ['mushrooms', 'lsd', 'safe'],
  ['mushrooms', 'weed', 'caution'],
  ['weed', 'ketamine', 'safe'],
  ['weed', 'lsd', 'caution'],
  ['weed', 'mushrooms', 'caution'],
  ['weed', 'mdma', 'caution'],
  ['weed', 'ghb', 'unknown'],
  ['weed', 'alcohol', 'caution'],
];

const STATUS_META = {
  safe: { color: '#10b981', symbol: '▲', es: 'Bajo riesgo', en: 'Low risk' },
  caution: { color: '#f59e0b', symbol: '◉', es: 'Precaución', en: 'Caution' },
  danger: { color: '#f97316', symbol: '!', es: 'Peligro', en: 'Danger' },
  unsafe: { color: '#dc2626', symbol: '✕', es: 'NO mezclar', en: 'Unsafe' },
  unknown: { color: '#71717a', symbol: '?', es: 'Desconocido', en: 'Unknown' },
};

function getInteraction(a, b) {
  const pair = INTERACTIONS.find(([x, y]) =>
    (x === a && y === b) || (x === b && y === a));
  return pair ? pair[2] : 'unknown';
}

export default function HarmReduction() {
  const bt = isBT();
  const [selA, setSelA] = useState('alcohol');
  const [selB, setSelB] = useState('cocaine');

  const result = getInteraction(selA, selB);
  const meta = STATUS_META[result];
  const subA = SUBSTANCES.find(s => s.id === selA);
  const subB = SUBSTANCES.find(s => s.id === selB);

  const L = {
    EN: {
      title: 'Harm Reduction Guide',
      subtitle: 'Real information for trans sex workers. No judgment — just what keeps you safe.',
      intro: 'Built into the Vivas app, by trans workers for trans workers. Substances are mixed — the goal is that you are informed.',
      ruleTitle: 'Never mix these',
      checkTitle: 'Check an interaction',
      checkSub: 'Select two substances to see how they interact.',
      substancesTitle: 'Substance-by-substance',
      download: 'Get the Vivas app',
      browse: 'Browse profiles',
      legend: 'Legend',
      resultLabel: 'Interaction:',
      disclaimer: 'For harm reduction only. Does not encourage drug use. In crisis call emergency (911, 144, 016).',
      basedOn: 'Based on TripSit / AHF harm-reduction consensus data.',
    },
    ES: {
      title: 'Guía de Reducción de Daños',
      subtitle: 'Información real para trabajadoras sexuales trans. Sin juzgar — solo lo que te cuida.',
      intro: 'Integrada en la app Vivas, por trabajadoras trans para trabajadoras trans. Las sustancias se mezclan — el objetivo es que estés informada.',
      ruleTitle: 'Nunca mezcles estas',
      checkTitle: 'Chequeá una interacción',
      checkSub: 'Seleccioná dos sustancias para ver cómo interactúan.',
      substancesTitle: 'Sustancia por sustancia',
      download: 'Descargá la app Vivas',
      browse: 'Explorar perfiles',
      legend: 'Leyenda',
      resultLabel: 'Interacción:',
      disclaimer: 'Solo para reducción de daños. No promueve el consumo. En crisis llamá a emergencias (911, 144, 016).',
      basedOn: 'Basado en datos de consenso de TripSit / AHF sobre reducción de daños.',
    },
  }[bt ? 'ES' : 'EN'];

  const name = (id) => (bt ? SUBSTANCES.find(s => s.id === id).es : SUBSTANCES.find(s => s.id === id).en);
  const dangerPairs = INTERACTIONS.filter(([, , s]) => s === 'unsafe' || s === 'danger');

  return (
    <div className="harm-page">
      <SEO
        title={bt ? 'Guía de Reducción de Daños | BuscaTrans' : 'Harm Reduction Guide | ShemaleWiki'}
        description={bt
          ? 'Tabla de interacciones de drogas para trabajadoras sexuales trans: combinaciones peligrosas, sustancias y cómo cuidarte. Información real, sin juzgar.'
          : 'Drug interaction chart for trans sex workers: dangerous combinations, substances, and how to stay safe. Real information, no judgment.'}
        canonicalPath="/guia-reduccion-danos"
        lang={bt ? 'es' : 'en'}
      />

      <div className="harm-hero">
        <p className="harm-eyebrow">💜 VIVAS · SHEMALEWIKI · BUSCATRANS</p>
        <h1>{L.title}</h1>
        <p className="harm-subtitle">{L.subtitle}</p>
        <p className="harm-intro">{L.intro}</p>
      </div>

      {/* Interactive checker */}
      <div className="harm-checker">
        <h2>🔍 {L.checkTitle}</h2>
        <p className="harm-checker-sub">{L.checkSub}</p>
        <div className="harm-selects">
          <select value={selA} onChange={e => setSelA(e.target.value)}>
            {SUBSTANCES.map(s => (
              <option key={s.id} value={s.id}>{s.emoji} {bt ? s.es : s.en}</option>
            ))}
          </select>
          <span className="harm-plus">+</span>
          <select value={selB} onChange={e => setSelB(e.target.value)}>
            {SUBSTANCES.map(s => (
              <option key={s.id} value={s.id}>{s.emoji} {bt ? s.es : s.en}</option>
            ))}
          </select>
        </div>
        <div className="harm-result" style={{ borderColor: meta.color, background: `${meta.color}1a` }}>
          <div className="harm-result-symbol" style={{ color: meta.color }}>{meta.symbol}</div>
          <div>
            <div className="harm-result-label">{L.resultLabel}</div>
            <div className="harm-result-status" style={{ color: meta.color }}>
              {subA.emoji} {bt ? subA.es : subA.en} + {subB.emoji} {bt ? subB.es : subB.en} → <strong>{bt ? meta.es : meta.en}</strong>
            </div>
          </div>
        </div>
        <div className="harm-legend">
          <strong>{L.legend}:</strong>
          {Object.entries(STATUS_META).map(([k, v]) => (
            <span key={k} style={{ color: v.color }}>
              {v.symbol} {bt ? v.es : v.en}
            </span>
          ))}
        </div>
        <p className="harm-basedon">* {L.basedOn}</p>
      </div>

      {/* Never mix list */}
      <div className="harm-rule">
        <h2>⚠️ {L.ruleTitle}</h2>
        <ul>
          {[...new Set(dangerPairs.map(([a, b]) => [a, b].sort().join('|')))].slice(0, 12).map((pair, i) => {
            const [a, b] = pair.split('|');
            return (
              <li key={i}>{name(a)} + {name(b)} → <span style={{ color: '#dc2626', fontWeight: 700 }}>✕</span></li>
            );
          })}
        </ul>
      </div>

      <div className="harm-cta">
        <h2>{bt ? 'Descargá Vivas' : 'Get the Vivas app'}</h2>
        <p>
          {bt
            ? 'La app Vivas incluye esta guía + botón de emergencia + check-in de seguridad. Gratis, para trabajadoras.'
            : 'The Vivas app includes this guide + emergency button + safety check-in. Free, for workers.'}
        </p>
        <div className="harm-cta-buttons">
          <a href="/downloads/vivas.apk" className="btn btn-primary btn-lg">{L.download}</a>
          <Link to={bt ? '/es/europe' : '/europe'} className="btn btn-secondary btn-lg">{L.browse}</Link>
        </div>
      </div>

      <p className="harm-disclaimer">{L.disclaimer}</p>
    </div>
  );
}
