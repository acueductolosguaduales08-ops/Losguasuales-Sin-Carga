import { useEffect, useState } from 'react';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import { X, Loader2 } from 'lucide-react';
import { PeriodosAPI } from '../../api/periodos';
import { useToast } from '../../context/ToastContext';

const inputCls =
  'w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-lg px-4 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-brand transition-colors';
const labelCls = 'block text-sm text-gray-500 dark:text-gray-400 mb-1';

// Modal de creación de año contable (POST /api/v1/periodos/anios).
export default function AnioFormModal({ open, onClose, onCreated }) {
  useLockBodyScroll(Boolean(open), onClose);

  const { success, warning, error } = useToast();
  const [anio, setAnio] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setAnio(String(new Date().getFullYear()));
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const val = parseInt(anio, 10);
    if (!val || Number.isNaN(val)) {
      warning("Año inválido.", "Debes ingresar un año válido.");
      return;
    }

    setSubmitting(true);
    try {
      const nuevo = await PeriodosAPI.crearAnio(val);
      success("Ejercicio creado.", `El ejercicio contable ${val} se registró exitosamente.`);
      onCreated?.(nuevo);
      onClose();
    } catch (err) {
      info("Error al crear.", err.message || 'No se pudo crear el año contable.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-shell fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="modal-shell__card relative w-full max-w-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease] flex flex-col max-h-[90dvh]"
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-shell__header p-5 border-b border-gray-200 dark:border-dark-muted flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">Nuevo ejercicio contable</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-shell__body flex-1 overflow-y-auto overscroll-contain p-5 space-y-4">
          <div>
            <label className={labelCls}>
              Año <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              autoFocus
              value={anio}
              onChange={(e) => setAnio(e.target.value)}
              placeholder="Ingrese el año"
              className={inputCls}
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
              Crear año
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
