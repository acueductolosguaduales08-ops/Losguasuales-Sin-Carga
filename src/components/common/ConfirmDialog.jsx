import { AlertTriangle } from 'lucide-react';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';

// Diálogo pequeño de confirmación para no perder datos por accidente al
// cerrar un formulario con cambios sin guardar.
export default function ConfirmDialog({
  open,
  title = '¿Descartar cambios?',
  message = 'Lo que llevas escrito se perderá si sales ahora.',
  confirmLabel = 'Descartar',
  cancelLabel = 'Seguir editando',
  onConfirm,
  onCancel,
}) {
  useLockBodyScroll(Boolean(open), onCancel);

  if (!open) return null;

  return (
    <div className="modal-shell fixed inset-0 z-[130] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain" onClick={onCancel}>
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div
        className="modal-shell__card relative w-full max-w-xs bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-5 text-center animate-[modalPop_0.2s_ease] flex flex-col justify-center"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-500 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h4 className="font-bold text-gray-800 dark:text-white mb-1">{title}</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-dark-muted text-gray-700 dark:text-white text-sm font-semibold hover:bg-gray-200 dark:hover:bg-dark-muted/80 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
