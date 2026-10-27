import { X, Lock, Unlock, Info, Loader2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';

const ESTADO_BADGE = {
  ABIERTO: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  REABIERTO: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  CERRADO: 'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-600',
};

// Modal de detalle de un mes contable, con acciones de cierre/reapertura (Reglas 9.6 / 9.8).
export default function MesDetalleModal({ open, mes, esAdmin, cerrando, onClose, onCerrar, onSolicitarReabrir }) {
  useLockBodyScroll(Boolean(open), onClose);
  const navigate = useNavigate();

  if (!open || !mes) return null;
  const estaAbierto = mes.estado !== 'CERRADO';

  return (
    <div className="modal-shell fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="modal-shell__card relative w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease] flex flex-col max-h-[90dvh]"
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-shell__header p-5 border-b border-gray-200 dark:border-dark-muted flex justify-between items-start">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2 flex-wrap">
            {mes.nombreMes} {mes.anio}
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                ESTADO_BADGE[mes.estado] || ESTADO_BADGE.CERRADO
              }`}
            >
              {mes.estado}
            </span>
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors shrink-0"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-shell__body flex-1 overflow-y-auto overscroll-contain p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-xl p-3">
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase mb-1">N° de mes</p>
              <p className="text-gray-800 dark:text-white font-mono">{mes.numeroMes}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-xl p-3">
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase mb-1">Apertura</p>
              <p className="text-gray-800 dark:text-white font-mono">{mes.fechaApertura || '—'}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-xl p-3 col-span-2">
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase mb-1">Cierre</p>
              <p className="text-gray-800 dark:text-white font-mono">{mes.fechaCierre || '—'}</p>
            </div>
          </div>

          {esAdmin && (
            <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-xl p-3 flex gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Info className="w-4 h-4 text-brand shrink-0 mt-0.5" />
              {estaAbierto ? (
                <span>
                  <strong className="text-gray-800 dark:text-white">Regla 9.8:</strong> el sistema valida que todas
                  las lecturas y facturas estén completas antes de cerrar.
                </span>
              ) : (
                <span>
                  <strong className="text-gray-800 dark:text-white">Regla 9.6:</strong> la reapertura exige registrar
                  un motivo formal de corrección administrativa.
                </span>
              )}
            </div>
          )}
        </div>

        {esAdmin && (
          <div className="modal-shell__footer p-5 border-t border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950/40 flex justify-end gap-3">
            <button
              onClick={() => navigate(`/periodos-contables/${mes.id}`)}
              className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-muted text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-dark-muted/80 transition-colors text-sm font-semibold flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" /> Ver página completa
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-muted text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-dark-muted/80 transition-colors text-sm font-semibold"
            >
              Cerrar ventana
            </button>
            {estaAbierto ? (
              <button
                onClick={() => onCerrar(mes)}
                disabled={cerrando}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white transition-colors text-sm font-semibold flex items-center gap-2"
              >
                {cerrando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Clausurar mes
              </button>
            ) : (
              <button
                onClick={() => onSolicitarReabrir(mes)}
                className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-dark text-white transition-colors text-sm font-semibold flex items-center gap-2"
              >
                <Unlock className="w-4 h-4" />
                Reabrir mes
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
