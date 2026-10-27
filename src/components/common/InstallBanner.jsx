import { X, Download } from 'lucide-react';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';

/**
 * Banner que invita al usuario a instalar la app como PWA.
 * Aparece solo si el navegador lo soporta y el usuario no lo descarto.
 */
export default function InstallBanner() {
  const { canInstall, install, dismiss } = useInstallPrompt();

  if (!canInstall) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 z-50 flex justify-center pointer-events-none">
      <div className="pointer-events-auto w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl p-4 flex items-center gap-3 animate-[slideUp_0.3s_ease]">
        <div className="p-2.5 rounded-xl bg-brand/10 shrink-0">
          <Download className="w-5 h-5 text-brand" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-800 dark:text-white">Instalar app</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            Accede mas rapido desde tu pantalla de inicio
          </p>
        </div>
        <button
          onClick={install}
          className="px-3 py-1.5 bg-brand hover:bg-brand-dark text-white text-xs font-semibold rounded-lg transition-colors shrink-0"
        >
          Instalar
        </button>
        <button
          onClick={dismiss}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 shrink-0"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
