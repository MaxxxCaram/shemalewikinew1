import { useEffect } from 'react';

/**
 * ShemaleWiki "Velvet Noir" — vanguard scroll-reveal.
 * Adds `.sw-in` to every `.sw-reveal` element as it enters the viewport,
 * triggering the CSS entrance transition (opacity + translateY).
 * Respects prefers-reduced-motion (CSS forces elements visible).
 * Safe no-op when the elements aren't present.
 */
export default function useScrollReveal(deps = []) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const els = Array.from(document.querySelectorAll('.sw-reveal:not(.sw-in)'));
    if (els.length === 0) return;

    if (!('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('sw-in'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('sw-in');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.08 }
    );

    els.forEach(el => observer.observe(el));

    // Red de seguridad: si el IntersectionObserver no dispara (elemento
    // "skipped", observer roto, navegador raro), forzamos la visibilidad a
    // los 1500 ms. Sin esto, una tarjeta no revelada queda con opacity 0
    // PARA SIEMPRE y la lista parece vacía.
    const safety = setTimeout(() => {
      els.forEach(el => el.classList.add('sw-in'));
    }, 1500);

    return () => { observer.disconnect(); clearTimeout(safety); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
