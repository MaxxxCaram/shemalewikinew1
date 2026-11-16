import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getProxiedImageUrl } from '../utils';

const isBT = () => typeof window !== 'undefined' && window.location.hostname.includes('buscatrans');

/**
 * Fullscreen lightbox for gallery images.
 * Keyboard: ← → to navigate, ESC to close.
 * Click outside image to close.
 * Images are served through the proxy to bypass hotlink-blocking (web.archive.org).
 */
export default function Lightbox({ images, currentIndex, onClose, onNavigate }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const goNext = useCallback(() => {
    onNavigate((currentIndex + 1) % images.length);
  }, [currentIndex, images.length, onNavigate]);

  const goPrev = useCallback(() => {
    onNavigate((currentIndex - 1 + images.length) % images.length);
  }, [currentIndex, images.length, onNavigate]);

  useEffect(() => {
    const handleKey = (e) => {
      switch (e.key) {
        case 'Escape': onClose(); break;
        case 'ArrowRight': goNext(); break;
        case 'ArrowLeft': goPrev(); break;
      }
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose, goNext, goPrev]);

  const closeRef = useRef(null);
  useEffect(() => {
    const prevFocus = document.activeElement;
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      if (prevFocus && typeof prevFocus.focus === 'function') prevFocus.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    setLoaded(false);
    setError(false);
    // Safety timeout: if the proxy hangs, never leave the lightbox in an
    // infinite "loading" state (which can contribute to a frozen UI).
    const t = setTimeout(() => setLoaded(true), 8000);
    return () => clearTimeout(t);
  }, [currentIndex]);

  if (!images || images.length === 0) return null;

  const current = images[currentIndex];
  const src = current?.photo_url || current;
  const displaySrc = getProxiedImageUrl(src);

  return (
    <div className="lightbox-overlay" role="dialog" aria-modal="true" aria-label={isBT() ? 'Visor de fotos' : 'Photo viewer'} onClick={onClose}>
      <button ref={closeRef} className="lightbox-close" onClick={onClose} aria-label={isBT() ? 'Cerrar' : 'Close'}>
        <X size={28} />
      </button>

      {images.length > 1 && (
        <>
          <button className="lightbox-nav lightbox-prev" onClick={(e) => { e.stopPropagation(); goPrev(); }} aria-label={isBT() ? 'Anterior' : 'Previous'}>
            <ChevronLeft size={36} />
          </button>
          <button className="lightbox-nav lightbox-next" onClick={(e) => { e.stopPropagation(); goNext(); }} aria-label={isBT() ? 'Siguiente' : 'Next'}>
            <ChevronRight size={36} />
          </button>
        </>
      )}

      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        {!loaded && !error && <div className="lightbox-loading"><div className="lightbox-spinner" /></div>}
        {error ? (
          <div className="lightbox-error">⚠️ Could not load photo</div>
        ) : (
          <img
            src={displaySrc}
            alt={`${isBT() ? 'Foto' : 'Photo'} ${currentIndex + 1}`}
            className={`lightbox-img ${loaded ? 'loaded' : ''}`}
            onLoad={() => setLoaded(true)}
            onError={() => { setError(true); setLoaded(true); }}
          />
        )}
        
        <div className="lightbox-counter">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
    </div>
  );
}
