import { useEffect, useState } from 'react';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import { X, Loader2, TriangleAlert } from 'lucide-react';
import { FacturasAPI } from '../../api/facturas';
import { useToast } from '../../context/ToastContext';

// Modal de confirmación para anular una factura (POST /api/v1/facturas/{id}/anular?motivo=).
export default function AnularFacturaModal({ open, factura, onClose, onSaved }) {
  useLockBodyScroll(Boolean(open), onClose);

  const { success, error, warning, info } = useToast();
  const [motivo, setMotivo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setMotivo('');
  }, [open]);

  if (!open || !factura) return null;

  const handleConfirmar = async () => {
    if (!motivo.trim()) {
      warning("Motivo requerido.", "Describe la razón de la anulación.");
      return;
    }
    setSubmitting(true);
    try {
      await FacturasAPI.anular(factura.id, motivo.trim());
      success("Factura anulada.", "La factura quedó marcada como anulada.");
      onSaved?.();
      onClose();
    } catch (err) {
      error(err.message || 'Error al anular factura.', "No se pudo procesar la anulación.");
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
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">Anular factura</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-shell__body flex-1 overflow-y-auto overscroll-contain p-5 space-y-4">
          <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/40 rounded-lg p-3">
            <TriangleAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-400">
              Esta acción no se puede deshacer. La factura quedará marcada como ANULADA y dejará de contar en la
              cartera del asociado.
            </p>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Vas a anular la factura{' '}
            <strong className="text-gray-800 dark:text-white">{factura.numeroFactura}</strong> de{' '}
            {factura.asociadoNombre}.
          </p>

          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
              Motivo de anulación <span className="text-red-500">*</span>
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              placeholder="Describa el motivo de la anulación"
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-lg px-4 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-brand transition-colors resize-none"
            />
          </div>
        </div>

        <div className="modal-shell__footer p-5 border-t border-gray-200 dark:border-dark-muted flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-muted text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-dark-muted/80 transition-colors text-sm font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white transition-colors text-sm font-semibold flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Anular factura
          </button>
        </div>
      </div>
    </div>
  );
}
