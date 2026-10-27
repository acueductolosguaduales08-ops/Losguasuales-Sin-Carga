import { useEffect, useState } from 'react';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import { X, Loader2 } from 'lucide-react';
import { AsociadosAPI } from '../../api/asociados';
import { useToast } from '../../context/ToastContext';
import NotificarModal from '../notificarDocumento/NotificarModal';

const ESTADO_OPCIONES = [
  { value: 'ACTIVO', label: 'Activo' },
  { value: 'SUSPENDIDO', label: 'Suspendido' },
  { value: 'INACTIVO', label: 'Inactivo' },
];

// Modal de cambio de estado del servicio (PATCH /api/v1/asociados/{id}/estado-servicio).
export default function AsociadoEstadoModal({ open, asociado, onClose, onSaved }) {
  useLockBodyScroll(Boolean(open), onClose);

  const { success, error, info } = useToast();
  const [estado, setEstado] = useState('ACTIVO');
  const [motivo, setMotivo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notificarInfo, setNotificarInfo] = useState(null); // { tipo, documento }

  useEffect(() => {
    if (open && asociado) {
      setEstado(asociado.estadoServicio || 'ACTIVO');
      setMotivo('');
    }
  }, [open, asociado]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const estadoAnterior = asociado.estadoServicio;
    try {
      await AsociadosAPI.cambiarEstadoServicio(asociado.id, { estado, motivo: motivo.trim() || null });
      success("Estado actualizado.", "El estado del servicio se cambió correctamente.");
      onSaved?.();
      onClose();

      // Si el cambio fue una suspensión o una reactivación (de suspendido a activo),
      // ofrecemos notificar al asociado de inmediato con los datos ya en mano.
      let tipoNotificacion = null;
      if (estado === 'SUSPENDIDO') tipoNotificacion = 'SUSPENSION';
      else if (estado === 'ACTIVO' && estadoAnterior === 'SUSPENDIDO') tipoNotificacion = 'REACTIVACION';

      if (tipoNotificacion) {
        setNotificarInfo({
          tipo: tipoNotificacion,
          documento: { motivo: motivo.trim() || null, fecha: new Date().toISOString() },
        });
      }
    } catch (err) {
      error("Error al actualizar.", err.message || 'No se pudo cambiar el estado del servicio.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {open && asociado && (
        <div className="modal-shell fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
          <div className="modal-shell__card relative w-full max-w-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease] flex flex-col max-h-[90dvh]"
        role="dialog"
        aria-modal="true"
      >
            <div className="modal-shell__header p-5 border-b border-gray-200 dark:border-dark-muted flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">Estado del servicio</h3>
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
                Actualiza el estado del servicio de{' '}
                <strong className="text-gray-800 dark:text-white">
                  {asociado.nombres} {asociado.apellidos}
                </strong>
                . Este cambio no afecta su acceso a la plataforma.
              </p>

              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Nuevo estado</label>
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

              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Motivo del cambio</label>
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Describa el motivo"
                  rows={3}
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-lg px-4 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-brand transition-colors resize-none"
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
                  Aplicar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <NotificarModal
        open={!!notificarInfo}
        onClose={() => setNotificarInfo(null)}
        tipo={notificarInfo?.tipo || 'SUSPENSION'}
        documento={notificarInfo?.documento}
        asociadoId={asociado?.id}
        asociadoNombre={asociado ? `${asociado.nombres} ${asociado.apellidos}` : undefined}
      />
    </>
  );
}
