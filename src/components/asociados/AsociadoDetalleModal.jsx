import { X, FileBarChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';

function formatFecha(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

const ESTADO_BADGE = {
  ACTIVO: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  SUSPENDIDO: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  INACTIVO: 'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-600',
};

function inicial(nombre) {
  return (nombre || '?').trim().charAt(0).toUpperCase() || '?';
}

// Modal de solo lectura (GET /api/v1/asociados/{id}).
export default function AsociadoDetalleModal({ open, asociado, onClose }) {
  useLockBodyScroll(Boolean(open), onClose);
  const navigate = useNavigate();

  if (!open || !asociado) return null;

  return (
    <div className="modal-shell fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="modal-shell__card relative w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease] flex flex-col max-h-[90dvh]"
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-shell__header p-5 border-b border-gray-200 dark:border-dark-muted flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">Perfil del asociado</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-shell__body flex-1 overflow-y-auto overscroll-contain p-5">
          <div className="flex items-center gap-4 mb-6 border-b border-gray-200 dark:border-dark-muted pb-4">
            <div className="w-16 h-16 rounded-full bg-brand/20 text-brand flex items-center justify-center text-3xl font-bold shrink-0">
              {inicial(asociado.nombres)}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white truncate">
                {asociado.nombres} {asociado.apellidos}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{asociado.codigoInterno || '—'}</p>
              <span
                className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded border ${
                  ESTADO_BADGE[asociado.estadoServicio] || ESTADO_BADGE.INACTIVO
                }`}
              >
                {asociado.estadoServicio}
              </span>
              {asociado.archivado && (
                <span className="inline-block mt-1 ml-2 text-xs font-semibold px-2 py-0.5 rounded border bg-gray-100 text-gray-500 border-gray-300 dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-600">
                  Archivado
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div>
              <span className="block text-gray-400 dark:text-gray-500 text-xs">Documento</span>
              <span className="text-gray-800 dark:text-white">
                {asociado.tipoDocumento} {asociado.documento}
              </span>
            </div>
            <div>
              <span className="block text-gray-400 dark:text-gray-500 text-xs">Teléfono principal</span>
              <span className="text-gray-800 dark:text-white">{asociado.telefonoPrincipal || '—'}</span>
            </div>
            {asociado.telefonoAlternativo && (
              <div>
                <span className="block text-gray-400 dark:text-gray-500 text-xs">Teléfono alternativo</span>
                <span className="text-gray-800 dark:text-white">{asociado.telefonoAlternativo}</span>
              </div>
            )}
            {asociado.correo && (
              <div>
                <span className="block text-gray-400 dark:text-gray-500 text-xs">Correo</span>
                <span className="text-gray-800 dark:text-white break-all">{asociado.correo}</span>
              </div>
            )}
            <div className="col-span-2">
              <span className="block text-gray-400 dark:text-gray-500 text-xs">Dirección</span>
              <span className="text-gray-800 dark:text-white">
                {asociado.direccion || '—'}
                {asociado.barrioVereda ? ` · ${asociado.barrioVereda}` : ''}
              </span>
            </div>
            <div>
              <span className="block text-gray-400 dark:text-gray-500 text-xs">Medidor</span>
              <span className="font-mono text-brand">{asociado.numeroMedidor || '—'}</span>
            </div>
            <div>
              <span className="block text-gray-400 dark:text-gray-500 text-xs">Fecha afiliación</span>
              <span className="text-gray-800 dark:text-white">{formatFecha(asociado.fechaAfiliacion)}</span>
            </div>
          </div>

          <button
            onClick={() => {
              onClose();
              navigate(`/informes?tab=asociado&asociadoId=${asociado.id}&asociadoNombre=${encodeURIComponent(asociado.nombres + ' ' + asociado.apellidos)}`);
            }}
            className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-brand/30 bg-brand/10 hover:bg-brand/15 text-brand dark:text-brand-light text-sm font-semibold transition-colors"
          >
            <FileBarChart className="w-4 h-4" />
            Generar seguimiento del asociado
          </button>
        </div>
      </div>
    </div>
  );
}
