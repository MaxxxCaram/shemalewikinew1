import { useState, useRef, useEffect } from 'react';
import { getProxiedImageUrl } from '../utils';

/**
 * Lazy-loaded image with blur-up placeholder and graceful fallback.
 * Uses IntersectionObserver to lazy-load, but ALWAYS falls back to loading
 * after a short timeout — so a photo never stays stuck as a skeleton
 * (the bug where gallery/hero photos never appeared and clicks did nothing).
 */
export default function LazyImage({ src, alt, className, style, fallback }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    // Fallback timer: if IntersectionObserver never fires (element already in
    // view at mount, or observer unavailable), force-load after 500ms.
    const forceTimer = setTimeout(() => setInView(true), 500);

    if (typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
            clearTimeout(forceTimer);
          }
        },
        { rootMargin: '200px' }
      );
      if (imgRef.current) observer.observe(imgRef.current);
      return () => { observer.disconnect(); clearTimeout(forceTimer); };
    }
    // No IntersectionObserver — load immediately.
    setInView(true);
    return () => clearTimeout(forceTimer);
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
          loading="lazy"
        />
      )}
    </div>
  );
}
