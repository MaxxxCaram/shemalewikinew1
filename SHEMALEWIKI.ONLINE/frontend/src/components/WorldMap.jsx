import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

/**
 * Interactive world map — continents clickable, dark theme.
 * Replaces the old "coming soon" placeholder.
 * Data: profile counts per continent from PocketBase.
 */

// Simplified continent shapes (viewBox 0 0 1000 500, equirectangular-ish)
const CONTINENTS = [
  {
    id: 'europe', label: 'Europe', x: 480, y: 110,
    path: 'M470,95 L520,88 L560,95 L575,110 L565,128 L545,140 L520,150 L495,145 L478,130 L468,115 Z',
  },
  {
    id: 'americas', label: 'Americas', x: 230, y: 220,
    path: 'M120,90 L170,85 L215,100 L235,125 L225,155 L245,180 L265,215 L285,255 L270,300 L250,345 L235,390 L225,420 L215,395 L205,350 L195,300 L185,250 L160,200 L135,150 L118,115 Z',
  },
  {
    id: 'asia', label: 'Asia', x: 700, y: 150,
    path: 'M590,85 L660,75 L740,80 L820,95 L880,115 L900,140 L870,165 L830,180 L790,195 L750,210 L710,200 L675,185 L640,170 L605,150 L588,120 Z',
  },
  {
    id: 'africa', label: 'Africa', x: 500, y: 280,
    path: 'M465,180 L510,175 L545,190 L560,220 L555,255 L570,285 L560,320 L540,355 L520,380 L500,370 L480,335 L465,295 L455,250 L450,210 Z',
  },
  {
    id: 'oceania', label: 'Oceania', x: 830, y: 350,
    path: 'M790,330 L840,325 L880,340 L895,365 L875,385 L835,390 L800,375 L788,352 Z',
  },
];

const FLAG = { europe: '🇪🇺', americas: '🌎', asia: '🌏', africa: '🌍', oceania: '🇦🇺' };

export default function WorldMap() {
  const [counts, setCounts] = useState({});
  const [hovered, setHovered] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        for (const c of CONTINENTS) {
          const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .ilike('location', `${c.id}%`)
            .not('cam_chat', 'eq', 'rejected');
          setCounts(prev => ({ ...prev, [c.id]: count || 0 }));
        }
      } catch { /* counts optional — show map without numbers */ }
    })();
  }, []);

  return (
    <div className="worldmap-wrap sw-reveal">
      <svg
        viewBox="0 0 1000 500"
        className="worldmap-svg"
        role="img"
        aria-label="World map — browse by continent"
      >
        {/* subtle grid backdrop */}
        <defs>
          <radialGradient id="wmGlow" cx="50%" cy="45%" r="65%">
            <stop offset="0%" stopColor="rgba(231,192,132,0.07)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="wmLand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(231,192,132,0.16)" />
            <stop offset="100%" stopColor="rgba(199,93,107,0.10)" />
          </linearGradient>
        </defs>
        <rect width="1000" height="500" fill="url(#wmGlow)" />

        {CONTINENTS.map(c => {
          const n = counts[c.id];
          const isHover = hovered === c.id;
          return (
            <g
              key={c.id}
              onClick={() => navigate(`/${c.id}`)}
              onMouseEnter={() => setHovered(c.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}
              role="link"
              aria-label={`Browse ${c.label}`}
            >
              <path
                d={c.path}
                fill={isHover ? 'rgba(231,192,132,0.35)' : 'url(#wmLand)'}
                stroke={isHover ? '#e7c084' : 'rgba(231,192,132,0.35)'}
                strokeWidth={isHover ? 2 : 1}
                style={{ transition: 'fill 0.25s ease, stroke 0.25s ease' }}
              />
              {/* count badge */}
              <text
                x={c.x} y={c.y - 4}
                textAnchor="middle"
                style={{
                  fill: isHover ? '#e7c084' : 'rgba(255,255,255,0.85)',
                  fontSize: '20px', fontWeight: 700,
                  pointerEvents: 'none', transition: 'fill 0.25s ease',
                }}
              >
                {typeof n === 'number' ? n.toLocaleString() : '…'}
              </text>
              <text
                x={c.x} y={c.y + 14}
                textAnchor="middle"
                style={{
                  fill: isHover ? '#fff' : 'rgba(255,255,255,0.55)',
                  fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em',
                  textTransform: 'uppercase', pointerEvents: 'none',
                }}
              >
                {c.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* legend / hovered hint */}
      <div className="worldmap-hint">
        {hovered ? (
          <span>
            {FLAG[hovered]} {counts[hovered] !== undefined && `${counts[hovered].toLocaleString()} profiles`} — click to browse
          </span>
        ) : (
          <span>Select a continent</span>
        )}
      </div>
    </div>
  );
}
