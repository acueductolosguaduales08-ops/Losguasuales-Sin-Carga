import { useEffect, useMemo, useState } from 'react';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import { X, History, Trash2, MessageCircle, Mail, MessageSquareText, Copy } from 'lucide-react';
import { listarHistorial, limpiarHistorial } from '../../utils/notificarDocumento/historial';

const ICONO_CANAL = {
  WHATSAPP: MessageCircle,
  GMAIL: Mail,
  SMS: MessageSquareText,
  COPIAR: Copy,
};

const LABEL_TIPO = {
  FACTURA: 'Factura',
  RECIBO: 'Recibo',
  MULTA: 'Multa',
  SUSPENSION: 'Suspensión',
  REACTIVACION: 'Reactivación',
};

function formatFechaHora(iso) {
  try {
    return new Date(iso).toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

// Historial de notificaciones preparadas/copiadas/abiertas desde este navegador.
// Se guarda solo localmente (localStorage) mientras no exista un endpoint de backend.
export default function HistorialNotificacionesModal({ open, onClose, tipoDocumento }) {
  useLockBodyScroll(Boolean(open), onClose);

  const [filtroTipo, setFiltroTipo] = useState(tipoDocumento || '');
  const [entradas, setEntradas] = useState([]);

  useEffect(() => {
    if (!open) return;
    setFiltroTipo(tipoDocumento || '');
  }, [open, tipoDocumento]);

  useEffect(() => {
    if (!open) return;
    setEntradas(listarHistorial({ tipoDocumento: filtroTipo || undefined }));
  }, [open, filtroTipo]);

  const tiposPresentes = useMemo(() => {
    const todas = listarHistorial();
    return [...new Set(todas.map((e) => e.tipoDocumento))];
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  const handleLimpiar = () => {
    if (!window.confirm('¿Borrar todo el historial local de notificaciones? Esta acción no se puede deshacer.')) return;
    limpiarHistorial();
    setEntradas([]);
  };

  return (
    <div className="modal-shell fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="modal-shell__card relative w-full max-w-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease] max-h-[90dvh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-5 border-b border-gray-200 dark:border-dark-muted flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-brand" />
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">Historial de notificaciones</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Guardado localmente en este navegador</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-200 dark:border-dark-muted flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setFiltroTipo('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              !filtroTipo
                ? 'bg-gray-800 dark:bg-white border-gray-800 dark:border-white text-white dark:text-gray-900'
                : 'border-gray-200 dark:border-dark-muted text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
            }`}
          >
            Todos
          </button>
          {tiposPresentes.map((t) => (
            <button
              key={t}
              onClick={() => setFiltroTipo(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                filtroTipo === t
                  ? 'bg-gray-800 dark:bg-white border-gray-800 dark:border-white text-white dark:text-gray-900'
                  : 'border-gray-200 dark:border-dark-muted text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              {LABEL_TIPO[t] || t}
            </button>
          ))}

          {entradas.length > 0 && (
            <button
              onClick={handleLimpiar}
              className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:underline"
            >
              <Trash2 className="w-3.5 h-3.5" /> Borrar historial
            </button>
          )}
        </div>

        <div className="modal-shell__body overflow-y-auto overscroll-contain custom-scroll flex-1">
          {entradas.length === 0 ? (
            <div className="text-center py-16">
              <History className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-400 dark:text-gray-500">Aún no hay notificaciones registradas.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-dark-muted">
              {entradas.map((e) => {
                const Icon = ICONO_CANAL[e.canal] || MessageCircle;
                return (
                  <div key={e.id} className="p-4 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-950 flex items-center justify-center shrink-0 text-gray-500 dark:text-gray-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                          {LABEL_TIPO[e.tipoDocumento] || e.tipoDocumento} {e.documentoNumero}
                        </p>
                        <span className="text-[11px] text-gray-400 dark:text-gray-500 shrink-0">{formatFechaHora(e.fecha)}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{e.asociadoNombre}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {e.estado} · destinatario: <span className="font-mono">{e.destinatario}</span> · por {e.usuario}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
