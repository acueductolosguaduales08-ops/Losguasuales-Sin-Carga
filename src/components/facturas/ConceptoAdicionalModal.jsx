import { useEffect, useState } from 'react';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import { X, Loader2, PlusCircle } from 'lucide-react';
import { FacturasAPI } from '../../api/facturas';
import { useToast } from '../../context/ToastContext';
import { formatCOPInput, unformatCOP } from '../../utils/formatCOP';

// Modal para agregar un concepto adicional a una factura (POST /api/v1/facturas/conceptos).
export default function ConceptoAdicionalModal({ open, factura, onClose, onSaved }) {
  useLockBodyScroll(Boolean(open), onClose);

  const { success, error, warning, info } = useToast();
  const [descripcion, setDescripcion] = useState('');
  const [valor, setValor] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setDescripcion('');
      setValor('');
    }
  }, [open]);

  if (!open || !factura) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!descripcion.trim()) {
      warning("Descripción requerida.", "Ingresa una descripción para el concepto adicional.");
      return;
    }
    if (!valor || Number(valor) <= 0) {
      warning("Valor inválido.", "El monto del concepto debe ser mayor a cero.");
      return;
    }

    setSubmitting(true);
    try {
      await FacturasAPI.agregarConcepto({
        facturaId: factura.id,
        descripcion: descripcion.trim(),
        valor: Number(valor),
      });
      success("Concepto agregado.", "El concepto adicional quedó registrado en la factura.");
      onSaved?.();
      onClose();
    } catch (err) {
      error(err.message || 'Error al agregar concepto.', "No se pudo guardar el concepto adicional.");
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
          <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-brand" /> Concepto adicional
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-shell__body flex-1 overflow-y-auto overscroll-contain p-5 space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Se agregará a la factura <strong className="text-gray-800 dark:text-white">{factura.numeroFactura}</strong> de{' '}
            {factura.asociadoNombre}.
          </p>

          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
              Descripción <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ingrese el concepto"
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-lg px-4 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-brand transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
              Valor <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={formatCOPInput(valor)}
              onChange={(e) => setValor(unformatCOP(e.target.value))}
              placeholder="Ingrese el valor"
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-lg px-4 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-brand transition-colors"
            />
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
              Agregar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
