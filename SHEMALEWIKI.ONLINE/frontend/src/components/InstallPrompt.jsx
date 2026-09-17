import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

/**
 * Banner "Instalar app" (PWA).
 * - Android/Chrome: usa el evento beforeinstallprompt (instalación de un toque).
 * - iOS/Safari: no existe ese evento → se muestra la instrucción manual
 *   (Compartir → Añadir a pantalla de inicio).
 * Se oculta si ya está instalada (display-mode: standalone) o si la cerraron.
 */
export default function InstallPrompt() {
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
      return () => window.removeEventListener('beforeinstallprompt', onPrompt);
    } catch {
      return undefined;
    }
  }, []);

  const install = async () => {
    if (!deferred) { setVisible(false); return; }
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
