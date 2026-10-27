import { useEffect, useState } from 'react';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import { X, Loader2 } from 'lucide-react';
import { AsociadosAPI } from '../../api/asociados';
import { useToast } from '../../context/ToastContext';
import { formatCOP } from '../../utils/formatCOP';
import EstadoBadge from '../ui/EstadoBadge';

// Modal de resumen financiero (GET /api/v1/asociados/{id}/resumen-financiero).
export default function AsociadoFinanzasModal({ open, asociado, onClose }) {
  useLockBodyScroll(Boolean(open), onClose);

  const { error } = useToast();
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !asociado) return;
    const controller = new AbortController();
    setLoading(true);
    setResumen(null);
    AsociadosAPI.resumenFinanciero(asociado.id, controller.signal)
      .then(setResumen)
      .catch((err) => {
        if (err.name !== 'AbortError') error("Error al cargar resumen.", err.message || 'No se pudo obtener el resumen financiero.');
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [open, asociado]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open || !asociado) return null;

  return (
    <div className="modal-shell fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="modal-shell__card relative w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease] flex flex-col max-h-[90dvh]"
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-shell__header p-5 border-b border-gray-200 dark:border-dark-muted flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Resumen financiero</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {asociado.nombres} {asociado.apellidos}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-shell__body flex-1 overflow-y-auto overscroll-contain p-5">
          {loading && (
            <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Calculando resumen…</span>
            </div>
          )}

          {!loading && resumen && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="bg-gray-50 dark:bg-gray-950 border border-red-200 dark:border-red-900/50 p-4 rounded-lg text-center">
                  <span className="block text-gray-500 dark:text-gray-400 text-xs mb-1">Saldo pendiente</span>
                  <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {formatCOP(resumen.saldo_total ?? 0)}
                  </span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-950 border border-amber-200 dark:border-amber-900/50 p-4 rounded-lg text-center">
                  <span className="block text-gray-500 dark:text-gray-400 text-xs mb-1">Multas pendientes</span>
                  <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {formatCOP(resumen.total_multas ?? 0)}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-dark-muted divide-y divide-gray-200 dark:divide-dark-muted text-sm">
                <div className="p-3 flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Facturas pendientes</span>
                  <span className="font-mono text-red-600 dark:text-red-400">{resumen.facturas_pendientes ?? 0}</span>
                </div>
                <div className="p-3 flex justify-between bg-amber-50 dark:bg-amber-900/10">
                  <span className="text-gray-500 dark:text-gray-400">Multas pendientes (número)</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400">
                    {resumen.multas_pendientes ?? 0}
                  </span>
                </div>
              </div>

              {Array.isArray(resumen.ultimas_facturas) && resumen.ultimas_facturas.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Últimas facturas</p>
                  <div className="bg-gray-50 dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-dark-muted divide-y divide-gray-200 dark:divide-dark-muted text-sm">
                    {resumen.ultimas_facturas.map((f, i) => (
                      <div key={i} className="p-3 flex justify-between items-center gap-3">
                        <span className="font-mono text-gray-700 dark:text-gray-300 truncate">
                          {f.numero_factura}
                        </span>
                        <span className="flex items-center gap-3 shrink-0">
                          <span className="font-mono text-gray-800 dark:text-white">{formatCOP(f.total)}</span>
                          <EstadoBadge estado={f.estado} />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
