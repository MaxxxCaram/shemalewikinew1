import { useEffect, useState } from 'react';

/**
 * AdSlot — Banner publicitario configurable desde PocketBase (colección 'ads').
 *
 * Dos audiencias (campo `audience`):
 *   - 'clients'    → banners que ven los clientes (home, páginas de clientes).
 *                    Para ofrecer a las chicas: banners y destacados.
 *   - 'panel_trans'→ banners dentro del panel trans (dashboard).
 *                    Para ofrecer publicidad a cirujanos plásticos, clínicas de
 *                    láser, extensiones de cabello, etc.
 *
 * Props:
 *   slot:      nombre del slot (ej. 'home-top', 'city-top', 'dashboard-top').
 *   audience:  'clients' | 'panel_trans'.
 *   width:     ancho del banner (default 728).
 *   height:    alto del banner (default 90).
 *   className: clase CSS extra.
 *   fallback:  si no hay banner activo, mostrar el placeholder (default true).
 */
const PB_URL = 'https://api.shemalewiki.online';

export default function AdSlot({ slot, audience = 'clients', width = 728, height = 90, className = '', fallback = true }) {
  const [ad, setAd] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const filter = encodeURIComponent(`slot='${slot}' && audience='${audience}' && active=true`);
        const res = await fetch(`${PB_URL}/api/collections/ads/records?perPage=1&filter=${filter}&sort=-created`);
        const data = await res.json();
        if (!cancelled && data && data.items && data.items.length) {
          const item = data.items[0];
          const img = item.image && item.image.length
            ? `${PB_URL}/api/files/${item.collectionId}/${item.id}/${item.image[0]}`
            : null;
          setAd({ ...item, img });
        }
      } catch (e) {
        console.error(`[AdSlot] fetch error (slot=${slot}):`, e?.message || e);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [slot, audience]);

  // Banner real
  if (ad && ad.img) {
    const inner = (
      <img
        src={ad.img}
        alt={ad.title || 'Advertisement'}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    );
    return (
      <div
        className={`ad-banner${className ? ' ' + className : ''}`}
        style={{
          width: '100%',
          maxWidth: `${width}px`,
          height: `${height}px`,
          margin: '1.5rem auto',
          borderRadius: '8px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {ad.link ? <a href={ad.link} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', height: '100%' }}>{inner}</a> : inner}
        {ad.title && (
          <span style={{
            position: 'absolute', bottom: '4px', right: '8px',
            color: 'rgba(255,255,255,0.5)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            {ad.title}
          </span>
        )}
      </div>
    );
  }

  // Placeholder / fallback
  if (!loaded && fallback) {
    return (
      <div
        className={`ad-banner${className ? ' ' + className : ''}`}
        style={{
          width: '100%', maxWidth: `${width}px`, height: `${height}px`,
          margin: '1.5rem auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '8px',
        }}
      >
        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center', lineHeight: 1.5, padding: '0 1rem' }}>
          {audience === 'panel_trans'
            ? 'Anunciá tu clínica, cirujano o salón aquí'
            : 'You as a business ally can advertise here'}
        </span>
      </div>
    );
  }

  return null;
}
