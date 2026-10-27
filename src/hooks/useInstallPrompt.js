import { useState, useEffect } from 'react';

const DISMISSED_KEY = 'acueducto_install_dismissed';

/**
 * Hook para detectar si la app se puede instalar como PWA.
 * Captura el evento beforeinstallprompt y controla si mostrar el banner.
 */
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setCanInstall(false);
    return outcome === 'accepted';
  };

  const dismiss = () => {
    setIsDismissed(true);
    setCanInstall(false);
    try {
      localStorage.setItem(DISMISSED_KEY, 'true');
    } catch {
      // ignored
    }
  };

  return {
    canInstall: canInstall && !isDismissed,
    install,
    dismiss,
  };
}
