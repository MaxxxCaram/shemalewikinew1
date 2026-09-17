import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

/**
 * Banner "Instalar app" (PWA).
 * - variant="inline": bloque dentro del CTA "If you are trans, click here"
 *   (para que las chicas instalen la app y gestionen su perfil desde el tel).
 * - variant="floating" (default): aviso flotante abajo de la pantalla.
 * - Android/Chrome: usa beforeinstallprompt (instalación de un toque).
 * - iOS/Safari: no existe ese evento → instrucción manual (Compartir → Añadir).
 * Se oculta si ya está instalada (display-mode: standalone) o si la cerraron.
 */
export default function InstallPrompt({ variant = 'floating' }) {
  const [deferred, setDeferred] = useState(null);
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem('sw_install_dismissed')) return;
      const standalone = window.matchMedia('(display-mode: standalone)').matches
        || window.matchMedia('(display-mode: fullscreen)').matches
        || window.navigator.standalone === true;
      if (standalone) return;

      const onPrompt = (e) => {
        e.preventDefault();
        setDeferred(e);
        setVisible(true);
      };
      window.addEventListener('beforeinstallprompt', onPrompt);

      const ua = window.navigator.userAgent || '';
      const isIOS = /iPad|iPhone|iPod/.test(ua);
      const isSafari = /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(ua);
      if (isIOS && isSafari) {
        setIosHint(true);
        setVisible(true);
      }

      // En el bloque integrado mostramos siempre la propuesta (aunque el
      // navegador no dispare beforeinstallprompt todavía): si el usuario toca
      // "Instalar" sin evento, se explica el paso manual.
      if (variant === 'inline') setVisible(true);

      return () => window.removeEventListener('beforeinstallprompt', onPrompt);
    } catch {
      return undefined;
    }
  }, [variant]);

  const install = async () => {
    if (!deferred) { setIosHint(true); return; }
    deferred.prompt();
    try {
      const choice = await deferred.userChoice;
      if (choice && choice.outcome === 'accepted') setVisible(false);
    } catch { /* ignore */ }
    setDeferred(null);
  };

  const dismiss = () => {
    try { localStorage.setItem('sw_install_dismissed', '1'); } catch { /* ignore */ }
    setVisible(false);
  };

  if (!visible) return null;

  if (variant === 'inline') {
    return (
      <div className="app-install-inline">
        <Download className="app-install-icon" size={20} />
        <div className="app-install-text">
          {iosHint
            ? <>Instalá la app en tu teléfono: <b>Compartir</b> → <b>Añadir a pantalla de inicio</b></>
            : <>Bajá la app y gestioná tu perfil, fotos y videos desde el teléfono</>}
        </div>
        <button type="button" onClick={install} className="app-install-btn">
          {iosHint ? 'Ver cómo' : 'Instalar app'}
        </button>
        <button type="button" onClick={dismiss} aria-label="Cerrar" className="app-install-close">
          <X size={15} />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-md">
      <div className="flex items-center gap-3 rounded-2xl border border-white/12 bg-[#141a2e]/95 px-4 py-3 shadow-2xl backdrop-blur">
        <Download className="h-5 w-5 shrink-0 text-[#e28bb1]" />
        <div className="flex-1 text-[0.82rem] leading-tight text-white/90">
          {iosHint
            ? <>Instalá la app: tocá <b>Compartir</b> y elegí <b>Añadir a pantalla de inicio</b></>
            : <>Instalá ShemaleWiki en tu teléfono</>}
        </div>
        {!iosHint && (
          <button
            onClick={install}
            className="shrink-0 rounded-xl bg-[#e83e8c] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#d42f7c]"
          >
            Instalar
          </button>
        )}
        <button onClick={dismiss} aria-label="Cerrar" className="shrink-0 text-white/60 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
