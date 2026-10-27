import { useState, useEffect } from 'react';
import { X, Loader2, Trash2, Check, XCircle, Clock } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { ChatAPI } from '../../api/chat';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';

function formatFecha(fechaIso) {
  if (!fechaIso) return '';
  return new Date(fechaIso).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SolicitudesEliminacionModal({ open, onClose }) {
  const { success, error, info } = useToast();
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesandoId, setProcesandoId] = useState(null);

  useLockBodyScroll(open, onClose);

  const cargar = async () => {
    try {
      const data = await ChatAPI.listarSolicitudes();
      setSolicitudes(Array.isArray(data) ? data : []);
    } catch {
      error("Error al cargar", "No se pudieron cargar las solicitudes.");
    }
  };

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    cargar().finally(() => setLoading(false));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAceptar = async (sol) => {
    setProcesandoId(sol.id);
    try {
      await ChatAPI.aceptarSolicitud(sol.id);
      setSolicitudes((prev) => prev.filter((s) => s.id !== sol.id));
      success("Solicitud aceptada", "El mensaje será eliminado del chat.");
    } catch (err) {
      error("Error al aceptar", err.message || 'No se pudo procesar la solicitud.');
    } finally {
      setProcesandoId(null);
    }
  };

  const handleRechazar = async (sol) => {
    setProcesandoId(sol.id);
    try {
      await ChatAPI.rechazarSolicitud(sol.id);
      setSolicitudes((prev) => prev.filter((s) => s.id !== sol.id));
      success("Solicitud rechazada", "El mensaje permanecerá en el chat.");
    } catch (err) {
      error("Error al rechazar", err.message || 'No se pudo procesar la solicitud.');
    } finally {
      setProcesandoId(null);
    }
  };

  const handleCancelar = async (sol) => {
    setProcesandoId(sol.id);
    try {
      await ChatAPI.cancelarSolicitud(sol.id);
      setSolicitudes((prev) => prev.filter((s) => s.id !== sol.id));
      success("Solicitud cancelada", "La solicitud de eliminación fue cancelada.");
    } catch (err) {
      error("Error al cancelar", err.message || 'No se pudo cancelar la solicitud.');
    } finally {
      setProcesandoId(null);
    }
  };

  if (!open) return null;

  const pendientesRecibidas = solicitudes.filter((s) => s.estado === 'PENDIENTE' && !s.esSolicitante);
  const pendientesEnviadas = solicitudes.filter((s) => s.estado === 'PENDIENTE' && s.esSolicitante);
  const historial = solicitudes.filter((s) => s.estado !== 'PENDIENTE');

  return (
    <div className="modal-shell fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        className="modal-shell__card relative w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease] max-h-[80dvh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-5 border-b border-gray-200 dark:border-dark-muted flex justify-between items-center shrink-0">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-500" /> Solicitudes de eliminación
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain custom-scroll p-5 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Cargando solicitudes…</span>
            </div>
          ) : solicitudes.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No hay solicitudes pendientes.</p>
            </div>
          ) : (
            <>
              {/* Solicitudes recibidas (para aceptar/rechazar) */}
              {pendientesRecibidas.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                    Para ti (aceptar o rechazar)
                  </h4>
                  <div className="space-y-2">
                    {pendientesRecibidas.map((sol) => (
                      <div
                        key={sol.id}
                        className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-3"
                      >
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-semibold">{sol.solicitanteNombre || 'Alguien'}</span> quiere eliminar un mensaje:
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic truncate">
                          "{sol.mensajeTexto || 'Mensaje'}"
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                          {formatFecha(sol.fechaSolicitud)}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleAceptar(sol)}
                            disabled={procesandoId === sol.id}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            {procesandoId === sol.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            Aceptar
                          </button>
                          <button
                            onClick={() => handleRechazar(sol)}
                            disabled={procesandoId === sol.id}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-dark-muted hover:bg-gray-300 dark:hover:bg-dark-muted/80 text-gray-700 dark:text-gray-300 text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Rechazar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Solicitudes enviadas (para cancelar) */}
              {pendientesEnviadas.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                    Enviadas por ti (pendientes)
                  </h4>
                  <div className="space-y-2">
                    {pendientesEnviadas.map((sol) => (
                      <div
                        key={sol.id}
                        className="bg-gray-50 dark:bg-gray-950/50 border border-gray-200 dark:border-dark-muted rounded-xl p-3"
                      >
                        <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                          Mensaje: "{sol.mensajeTexto || 'Mensaje'}"
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                          Enviada {formatFecha(sol.fechaSolicitud)}
                        </p>
                        <button
                          onClick={() => handleCancelar(sol)}
                          disabled={procesandoId === sol.id}
                          className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          {procesandoId === sol.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          Cancelar solicitud
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Historial */}
              {historial.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                    Historial
                  </h4>
                  <div className="space-y-1">
                    {historial.map((sol) => (
                      <div
                        key={sol.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-500 dark:text-gray-400"
                      >
                        {sol.estado === 'ACEPTADA' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : sol.estado === 'RECHAZADA' ? (
                          <XCircle className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        )}
                        <span className="truncate">
                          {sol.estado === 'ACEPTADA' ? 'Aceptada' : sol.estado === 'RECHAZADA' ? 'Rechazada' : 'Cancelada'}
                          {' · '}
                          {formatFecha(sol.fechaRespuesta || sol.fechaSolicitud)}
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
