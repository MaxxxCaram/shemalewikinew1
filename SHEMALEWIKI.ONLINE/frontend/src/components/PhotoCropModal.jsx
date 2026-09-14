import { useState, useRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

/**
 * PhotoCropModal — Recorta una foto en el navegador (canvas nativo, sin librerías).
 * Arrastrar para encuadrar, slider de zoom, rotar 90°, "Aplicar recorte".
 * onApply(blob) entrega el recorte cuadrado (aspect) como JPEG.
 */
export default function PhotoCropModal({ src, aspect = 3 / 4, onApply, onClose }) {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState(null);
  const imgRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  const draw = useCallback(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;
    const W = canvas.width, H = canvas.height;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const coverScale = Math.max(W / iw, H / ih);
    const dw = iw * coverScale * zoom;
    const dh = ih * coverScale * zoom;
    ctx.drawImage(img, -dw / 2 + offset.x, -dh / 2 + offset.y, dw, dh);
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
    canvasRef.current.toBlob((blob) => { if (blob) onApply(blob); }, 'image/jpeg', 0.9);
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(5,3,15,0.94)', backdropFilter: 'blur(8px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: 560, marginBottom: '0.75rem' }}>
        <h3 style={{ margin: 0 }}>✂️ Recortar miniatura (3:4)</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X /></button>
      </div>
      <canvas
        ref={canvasRef}
        width={420}
        height={Math.round(420 / aspect)}
        style={{ maxWidth: '100%', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '0.75rem', cursor: 'grab', touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      />
      <img
        ref={imgRef}
        src={src}
        alt=""
        onLoad={() => setLoaded(true)}
        style={{ display: 'none' }}
        crossOrigin="anonymous"
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem', width: '100%', maxWidth: 560 }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Zoom</span>
        <input
          type="range" min="1" max="3" step="0.05" value={zoom}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
          style={{ flex: 1 }}
        />
        <button className="btn" onClick={() => setRotation((r) => (r + 90) % 360)}>↻ 90°</button>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
        <button className="btn" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={applyCrop}>✅ Aplicar recorte</button>
      </div>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.75rem', textAlign: 'center', maxWidth: 560 }}>
        Arrastrá la imagen para elegir qué parte se ve en la miniatura. El recorte no modifica la foto original de la galería.
      </p>
    </div>
  );
}
