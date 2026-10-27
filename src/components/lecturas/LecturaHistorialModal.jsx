import { useEffect, useState } from 'react';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import { X, Loader2, Droplet, History } from 'lucide-react';
import { LecturasAPI } from '../../api/lecturas';
import { useToast } from '../../context/ToastContext';

function formatFecha(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

// Modal de historial de consumo de un asociado (GET /api/v1/lecturas/asociado/{asociadoId}).
export default function LecturaHistorialModal({ open, lectura, onClose }) {
  useLockBodyScroll(Boolean(open), onClose);

  const { info, error } = useToast();
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !lectura) return;
    const controller = new AbortController();
    setLoading(true);
    setHistorial([]);
    LecturasAPI.historialAsociado(lectura.asociadoId, controller.signal)
      .then((data) => {
        const lista = Array.isArray(data) ? data : data?.content || [];
        setHistorial([...lista].sort((a, b) => new Date(b.fechaLectura) - new Date(a.fechaLectura)));
      })
      .catch((err) => {
        if (err.name !== 'AbortError') error("Error al cargar", err.message || 'No se pudo cargar el historial.');
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [open, lectura]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open || !lectura) return null;

  const maxConsumo = Math.max(1, ...historial.map((h) => h.consumoM3 || 0));

  return (
    <div className="modal-shell fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="modal-shell__card relative w-full max-w-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease] max-h-[85dvh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-5 border-b border-gray-200 dark:border-dark-muted flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <History className="w-5 h-5 text-brand shrink-0" />
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white truncate">Historial de consumo</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {lectura.asociadoNombre || `Asociado #${lectura.asociadoId}`} · Medidor {lectura.numeroMedidor}
              </p>
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

        <div className="modal-shell__body flex-1 p-5 overflow-y-auto overscroll-contain custom-scroll">
          {loading && (
            <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Cargando historial…</span>
            </div>
          )}

          {!loading && historial.length === 0 && (
            <div className="text-center py-12">
              <Droplet className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-400 dark:text-gray-500">Este asociado aún no tiene lecturas registradas.</p>
            </div>
          )}

          {!loading && historial.length > 0 && (
            <div className="space-y-2">
              {historial.map((h) => (
                <div
                  key={h.id}
                  className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-lg p-3 flex items-center gap-3"
                >
                  <div className="w-16 shrink-0 text-xs text-gray-500 dark:text-gray-400">
                    {formatFecha(h.fechaLectura)}
                  </div>
                  <div className="flex-grow h-2.5 bg-gray-200 dark:bg-dark-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand rounded-full transition-all"
                      style={{ width: `${Math.max(4, (h.consumoM3 / maxConsumo) * 100)}%` }}
                    />
                  </div>
                  <div className="w-16 shrink-0 text-right text-sm font-bold text-gray-800 dark:text-white">
                    {h.consumoM3} m³
                  </div>
                  {h.facturaGenerada && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-300 dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-600 shrink-0">
                      Facturada
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
