import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * PhotoCropModal — Recorta una foto en el navegador (canvas nativo, sin librerías).
 * Permite: arrastrar para encuadrar, slider de zoom, rotar 90°, y "Aplicar recorte".
 * Devuelve la imagen recortada como Blob via onApply(blob).
 */
export default function PhotoCropModal({ src, aspect = 3/4, onApply, onClose }) {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState(null);
  const imgRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  // draw on state change
  const draw = useCallback(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;
    const W = canvas.width, H = canvas.height;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W/2, H/2);
    ctx.rotate((rotation * Math.PI) / 180);
    const rad = (Math.abs(rotation) % 180 === 90) ? Math.PI/2 : 0;
    const scale = zoom;
    // base size: fit image to canvas * zoom
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const coverScale = Math.max(W/iw, H/ih);
    const dw = iw * coverScale * scale;
    const dh = ih * coverScale * scale;
    ctx.drawImage(img, -dw/2 + offset.x, -dh/2 + offset.y, dw, dh);
    ctx.restore();
  }, [zoom, rotation, offset]);

  useEffect(() => { if (loaded) draw(); }, [draw, loaded]);

  const onPointerDown = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    setDrag({ sx: e.clientX, sy: e.clientY, ox: offset.x, oy: offset.y, r });
  };
  const onPointerMove = (e) => {
    if (!drag) return;
    setOffset({ x: drag.ox + (e.clientX - drag.sx), y: drag.oy + (e.clientY - drag.sy) });
  };
  const onPointerUp = () => setDrag(null);

  const applyCrop = () => {
    const canvas = canvasRef.current;
    canvas.toBlob((blob) => { if (blob) onApply(blob); }, 'image/jpeg', 0.9);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(5,3,15,0.94)', backdropFilter: 'blur(8px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div style={{ color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        ✂️ Editar foto
      </div>

      <canvas
        ref={canvasRef}
        width={480} height={640}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          width: 'min(90vw, 420px)', aspectRatio: '3/4',
          border: '2px dashed var(--accent-primary)',
          borderRadius: '12px', touchAction: 'none', cursor: 'grab',
          background: '#0a0620', maxHeight: '60vh',
        }}
      />
      {/* hidden source image */}
      <img
        ref={imgRef}
        src={src}
        alt=""
        onLoad={() => setLoaded(true)}
        style={{ display: 'none' }}
        crossOrigin="anonymous"
      />

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Zoom</label>
        <input type="range" min="0.5" max="3" step="0.05" value={zoom}
          onChange={e => setZoom(parseFloat(e.target.value))}
          style={{ width: '140px' }} />
        <button onClick={() => setRotation(r => (r + 90) % 360)}
          style={{ padding: '0.5rem 0.9rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)', cursor: 'pointer' }}>
          🔄 Rotar
        </button>
        <button onClick={applyCrop}
          style={{ padding: '0.55rem 1.2rem', borderRadius: '8px', border: 'none', background: 'linear-gradient(120deg,#00e5ff,#9d4dff,#ff5eb7)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
          ✅ Aplicar recorte
        </button>
        <button onClick={onClose}
          style={{ padding: '0.55rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          Cancelar
        </button>
      </div>
      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
        Arrastrá para encuadrar · zoom para acercar · rotar para enderezar
      </div>
    </div>
  );
}
