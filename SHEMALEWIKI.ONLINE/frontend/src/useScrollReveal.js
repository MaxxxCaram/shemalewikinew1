import { useEffect } from 'react';

/**
 * ShemaleWiki "Velvet Noir" — vanguard scroll-reveal.
 * Adds `.sw-in` to every `.sw-reveal` element as it enters the viewport,
 * triggering the CSS entrance transition (opacity + translateY).
 *
 * Deterministic by design (2026-09-23): the previous IntersectionObserver
 * version ONLY observed elements present at effect-run time. With
 * "Load more" the listing grows WITHOUT changing the effect deps
 * ([profiles, cityCounts] — Load more only bumps `visible`), so the new
 * cards were never observed → stayed `opacity: 0` forever → "la lista se
 * corta / no cargan las últimas N". This version polls getBoundingClientRect
 * every 500ms + on scroll (cheap: ~200 rects) and flips any visible card.
 * No observer lifecycle to miss.
 */
export default function useScrollReveal(deps = []) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const tick = () => {
      const els = document.querySelectorAll('.sw-reveal:not(.sw-in)');
      if (els.length === 0) return;
      const vh = window.innerHeight;
      els.forEach((el) => {
        try {
          const r = el.getBoundingClientRect();
          if (r.top < vh && r.bottom > 0) el.classList.add('sw-in');
        } catch (e) { /* elemento desconectado */ }
      });
    };

    // Primera pasada inmediata + barrido periódico + al scrollear.
    tick();
    const iv = setInterval(tick, 500);
    const safety = setTimeout(tick, 1200);
    const onScroll = () => tick();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      clearInterval(iv);
      clearTimeout(safety);
      window.removeEventListener('scroll', onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}