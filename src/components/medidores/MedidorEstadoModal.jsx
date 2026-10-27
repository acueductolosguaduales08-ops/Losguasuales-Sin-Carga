import { useEffect, useState } from 'react';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import { X, Loader2 } from 'lucide-react';
import { MedidoresAPI } from '../../api/medidores';
import { useToast } from '../../context/ToastContext';

const ESTADO_OPCIONES = [
  { value: 'ACTIVO', label: 'Activo' },
  { value: 'EN_MANTENIMIENTO', label: 'En mantenimiento' },
  { value: 'DANADO', label: 'Dañado' },
  { value: 'RETIRADO', label: 'Retirado' },
];

// Modal de cambio de estado físico (PATCH /api/v1/medidores/{id}/estado?estado=...).
export default function MedidorEstadoModal({ open, medidor, onClose, onSaved }) {
  useLockBodyScroll(Boolean(open), onClose);

  const { success, error, info } = useToast();
  const [estado, setEstado] = useState('ACTIVO');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && medidor) setEstado(medidor.estado || 'ACTIVO');
  }, [open, medidor]);

  if (!open || !medidor) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await MedidoresAPI.cambiarEstado(medidor.id, estado);
      success("Estado actualizado.", "El estado del medidor se cambió correctamente.");
      onSaved?.();
      onClose();
    } catch (err) {
      error("Error al actualizar.", err.message || 'No se pudo cambiar el estado del medidor.');
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
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">Actualizar estado</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-shell__body flex-1 overflow-y-auto overscroll-contain p-5 space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Selecciona el nuevo estado físico para el medidor{' '}
            <strong className="text-gray-800 dark:text-white">{medidor.numero}</strong>.
          </p>

          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Estado</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-lg px-4 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-brand transition-colors"
            >
              {ESTADO_OPCIONES.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-3">
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
              Aplicar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
