import { X } from 'lucide-react';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';

function formatFecha(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

const ESTADO_LABEL = {
  ACTIVO: 'Activo',
  EN_MANTENIMIENTO: 'En mantenimiento',
  DANADO: 'Dañado',
  RETIRADO: 'Retirado',
};

const ESTADO_TEXT_CLS = {
  ACTIVO: 'text-emerald-600 dark:text-emerald-400',
  EN_MANTENIMIENTO: 'text-amber-600 dark:text-amber-400',
  DANADO: 'text-red-600 dark:text-red-400',
  RETIRADO: 'text-gray-500 dark:text-gray-400',
};

// Modal de solo lectura (GET /api/v1/medidores/{id}).
export default function MedidorDetalleModal({ open, medidor, onClose }) {
  useLockBodyScroll(Boolean(open), onClose);

  if (!open || !medidor) return null;

  return (
    <div className="modal-shell fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="modal-shell__card relative w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease] flex flex-col max-h-[90dvh]"
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-shell__header p-5 border-b border-gray-200 dark:border-dark-muted flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">Detalles del medidor</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-shell__body flex-1 overflow-y-auto overscroll-contain p-5 space-y-4">
          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div>
              <span className="block text-gray-400 dark:text-gray-500 text-xs">Código interno</span>
              <span className="font-mono text-gray-800 dark:text-white">{medidor.codigoInterno || '—'}</span>
            </div>
            <div>
              <span className="block text-gray-400 dark:text-gray-500 text-xs">Número de serie</span>
              <span className="font-medium text-gray-800 dark:text-white">{medidor.numero}</span>
            </div>
            <div>
              <span className="block text-gray-400 dark:text-gray-500 text-xs">Estado</span>
              <span className={`font-semibold ${ESTADO_TEXT_CLS[medidor.estado] || ESTADO_TEXT_CLS.RETIRADO}`}>
                {ESTADO_LABEL[medidor.estado] || medidor.estado}
              </span>
            </div>
            <div>
              <span className="block text-gray-400 dark:text-gray-500 text-xs">Ubicación</span>
              <span className="text-gray-800 dark:text-white">{medidor.ubicacion || '—'}</span>
            </div>
            <div>
              <span className="block text-gray-400 dark:text-gray-500 text-xs">Fecha instalación</span>
              <span className="text-gray-800 dark:text-white">{formatFecha(medidor.fechaInstalacion)}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-muted">
            <span className="block text-gray-400 dark:text-gray-500 text-xs mb-1">Asignación actual</span>
            <div className="bg-gray-50 dark:bg-gray-950 p-3 rounded-lg border border-gray-200 dark:border-dark-muted text-sm text-gray-700 dark:text-gray-200">
              {medidor.asociadoId
                ? `${medidor.asociadoNombre || 'Asociado'} (ID: ${medidor.asociadoId})`
                : 'Sin asociado asignado (ID: null)'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
