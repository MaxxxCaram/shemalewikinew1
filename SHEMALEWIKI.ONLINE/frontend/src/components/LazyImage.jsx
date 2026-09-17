import { useState, useRef, useEffect } from 'react';
import { getProxiedImageUrl } from '../utils';

/**
 * Lazy-loaded image with blur-up placeholder and graceful fallback.
 * Uses IntersectionObserver to lazy-load, but ALWAYS falls back to loading
 * after a short timeout — so a photo never stays stuck as a skeleton
 * (the bug where gallery/hero photos never appeared and clicks did nothing).
 */
export default function LazyImage({ src, alt, className, style, fallback, eager = false }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    // Load only when near the viewport. NO force-timer: a 500ms timeout that
    // sets every card inView makes all N images download at once (336+ on a
    // full country page) and freezes the compositor → black frames while
    // scrolling. IntersectionObserver with a generous rootMargin covers the
    // already-in-view-at-mount case (it fires immediately).
    if (typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
          }
        },
        { rootMargin: '400px' }
      );
      if (imgRef.current) observer.observe(imgRef.current);

      // Red de seguridad: si el observer no disparó y el elemento está dentro
      // del viewport, cargamos igual (evita skeletons eternos).
      const safety = setTimeout(() => {
        const el = imgRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight + 400 && r.bottom > -400) setInView(true);
      }, 1200);
      return () => { observer.disconnect(); clearTimeout(safety); };
    }
    // No IntersectionObserver — load immediately.
    setInView(true);
    return () => {};
  }, []);

  const displaySrc = error
    ? (fallback || getProxiedImageUrl(null))
    : (inView ? getProxiedImageUrl(src) : null);

  return (
    <div ref={imgRef} className={`lazy-img-wrapper ${className || ''}`} style={style}>
      {!loaded && !error && (
        <div className="lazy-img-skeleton">
          <div className="lazy-img-shimmer" />
        </div>
      )}
      {displaySrc && (
        <img
          src={displaySrc}
          alt={alt || ''}
          className={`lazy-img ${loaded ? 'lazy-img-loaded' : ''}`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : 'auto'}
        />
      )}
    </div>
  );
}
