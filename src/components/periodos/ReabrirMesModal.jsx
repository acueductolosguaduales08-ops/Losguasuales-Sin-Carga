import { useEffect, useState } from 'react';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import { X, Loader2, Unlock } from 'lucide-react';
import { PeriodosAPI } from '../../api/periodos';
import { useToast } from '../../context/ToastContext';

// Modal de reapertura de período — exige motivo formal, queda registrado en auditoría (Regla 9.6).
// POST /api/v1/periodos/meses/{mesId}/reabrir?motivo=...
export default function ReabrirMesModal({ open, mes, onClose, onReopened }) {
  useLockBodyScroll(Boolean(open), onClose);

  const { success, warning, info } = useToast();
  const [motivo, setMotivo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setMotivo('');
  }, [open]);

  if (!open || !mes) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!motivo.trim()) {
      warning("Motivo requerido.", "Debes ingresar el motivo de la reapertura.");
      return;
    }

    setSubmitting(true);
    try {
      const actualizado = await PeriodosAPI.reabrirMes(mes.id, motivo.trim());
      success("Período reabierto.", `${mes.nombreMes} ${mes.anio} fue reabierto exitosamente.`);
      onReopened?.(actualizado);
      onClose();
    } catch (err) {
      info("Error al reabrir.", err.message || 'No se pudo reabrir el período.');
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
        <div className="modal-shell__header p-5 border-b border-gray-200 dark:border-dark-muted flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-brand/10 rounded-lg shrink-0">
              <Unlock className="w-4 h-4 text-brand" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800 dark:text-white">Reabrir período</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Corrección administrativa · Regla 9.6</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors shrink-0"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-shell__body flex-1 overflow-y-auto overscroll-contain p-5 space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Vas a reabrir{' '}
            <strong className="text-gray-800 dark:text-white">
              {mes.nombreMes} {mes.anio}
            </strong>
            . Esta acción queda registrada en el historial de auditoría.
          </p>

          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
              Motivo de la reapertura <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              autoFocus
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Describe el motivo formal de la corrección…"
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-lg px-4 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-brand transition-colors resize-none"
            />
          </div>

          <div className="pt-1 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-muted text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-dark-muted/80 transition-colors text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-dark disabled:opacity-60 text-white transition-colors text-sm font-semibold flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirmar reapertura
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
