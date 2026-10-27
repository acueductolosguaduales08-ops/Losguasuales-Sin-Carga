import { useState } from 'react';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import { X, Loader2, TriangleAlert } from 'lucide-react';
import { AsociadosAPI } from '../../api/asociados';
import { useToast } from '../../context/ToastContext';

// Modal de confirmación para archivar (baja lógica) — DELETE /api/v1/asociados/{id}.
export default function AsociadoArchivarModal({ open, asociado, onClose, onSaved }) {
  useLockBodyScroll(Boolean(open), onClose);

  const { success, error, info } = useToast();
  const [submitting, setSubmitting] = useState(false);

  if (!open || !asociado) return null;

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await AsociadosAPI.archivar(asociado.id);
      success("Asociado archivado.", "El asociado fue marcado como archivado exitosamente.");
      onSaved?.();
      onClose();
    } catch (err) {
      error("Error al archivar.", err.message || 'No se pudo archivar el asociado.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-shell fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="modal-shell__card relative w-full max-w-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease] flex flex-col max-h-[90dvh]"
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-shell__header p-5 border-b border-gray-200 dark:border-dark-muted flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">Archivar asociado</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-shell__body flex-1 overflow-y-auto overscroll-contain p-5 space-y-4">
          <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/40 rounded-lg p-3">
            <TriangleAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Es una baja lógica: el asociado se marcará como archivado y no se eliminará su historial.
            </p>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            ¿Confirmas archivar a{' '}
            <strong className="text-gray-800 dark:text-white">
              {asociado.nombres} {asociado.apellidos}
            </strong>
            ?
          </p>
        </div>

        <div className="modal-shell__footer p-5 border-t border-gray-200 dark:border-dark-muted flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-muted text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-dark-muted/80 transition-colors text-sm font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white transition-colors text-sm font-semibold flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Archivar
          </button>
        </div>
      </div>
    </div>
  );
}
