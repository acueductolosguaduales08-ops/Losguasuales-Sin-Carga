import { useState } from 'react';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import { X, Receipt, ExternalLink, Download, Loader2, FileText, User, CalendarClock, Info, MessageCircle } from 'lucide-react';
import { RecibosAPI } from '../../api/recibos';
import { useToast } from '../../context/ToastContext';
import NotificarModal from '../notificarDocumento/NotificarModal';
import { formatCOP } from '../../utils/formatCOP';

function formatFechaHora(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

// Modal de detalle de un movimiento: muestra la información completa y,
// cuando el movimiento tiene un recibo asociado (pagos de factura), permite
// verlo en HTML o descargarlo en PDF (mismo patrón que ReciboCard).
export default function MovimientoReciboModal({ open, movimiento, onClose }) {
  useLockBodyScroll(Boolean(open), onClose);

  const { success, error, warning, info } = useToast();
  const [abriendo, setAbriendo] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [notificarOpen, setNotificarOpen] = useState(false);

  if (!open || !movimiento) return null;

  const esEntrada = movimiento.tipo === 'ENTRADA';
  const tieneRecibo = Boolean(movimiento.reciboNumero);

  const handleVerHtml = async () => {
    if (!tieneRecibo) return;
    setAbriendo(true);
    info("Vista previa del recibo.", "Abriendo nueva ventana con el recibo en HTML.");
    try {
      const html = await RecibosAPI.html(movimiento.reciboNumero);
      const ventana = window.open('', '_blank');
      if (ventana) {
        ventana.document.write(html);
        ventana.document.close();
      } else {
        warning("Ventana bloqueada.", "El navegador bloqueó la ventana emergente. Permite ventanas emergentes para este sitio.");
      }
    } catch (err) {
      error(err.message || 'Error al abrir recibo.', "No se pudo generar la vista previa del recibo.");
    } finally {
      setAbriendo(false);
    }
  };

  const handleDescargar = async () => {
    if (!tieneRecibo) return;
    setDescargando(true);
    try {
      const res = await RecibosAPI.abrirPdf(movimiento.reciboNumero);
      if (res?.ok) success('Recibo abierto', 'Usa "Guardar como PDF" en el diálogo de impresión.');
    } catch (err) {
      error(err.message || 'Error al descargar recibo.', "No se pudo obtener el archivo PDF del recibo.");
    } finally {
      setDescargando(false);
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
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">Detalle del movimiento</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-shell__body flex-1 overflow-y-auto overscroll-contain p-5 space-y-4">
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wide mb-1 truncate">
              {movimiento.concepto || 'Sin concepto'}
            </p>
            <p className={`text-2xl font-black ${esEntrada ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
              {esEntrada ? '+' : '-'}
              {formatCOP(movimiento.valor)}
            </p>
          </div>

          <div className="space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="font-mono">{movimiento.numeroFormateado}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-gray-400 shrink-0" />
              {formatFechaHora(movimiento.fecha)}
            </div>
            {movimiento.usuario && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400 shrink-0" />
                {movimiento.usuario}
              </div>
            )}
            {movimiento.facturaNumero && (
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                Factura {movimiento.facturaNumero}
              </div>
            )}
          </div>

          {tieneRecibo ? (
            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                onClick={handleVerHtml}
                disabled={abriendo}
                className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl bg-gray-100 dark:bg-dark-muted hover:bg-gray-200 dark:hover:bg-dark-muted/80 disabled:opacity-60 text-gray-700 dark:text-white text-xs font-semibold transition-colors"
              >
                {abriendo ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                Ver
              </button>
              <button
                onClick={() => setNotificarOpen(true)}
                className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl bg-gray-100 dark:bg-dark-muted hover:bg-gray-200 dark:hover:bg-dark-muted/80 text-gray-700 dark:text-white text-xs font-semibold transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Notificar
              </button>
              <button
                onClick={handleDescargar}
                disabled={descargando}
                className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-60 text-white text-xs font-semibold transition-colors"
              >
                {descargando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Descargar
              </button>
            </div>
          ) : (
            <div className="flex items-start gap-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-lg p-3 text-xs text-gray-500 dark:text-gray-400">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              Este movimiento no tiene un recibo asociado.
            </div>
          )}
        </div>
      </div>

      {tieneRecibo && (
        <NotificarModal
          open={notificarOpen}
          onClose={() => setNotificarOpen(false)}
          tipo="RECIBO"
          documento={{
            numeroRecibo: movimiento.reciboNumero,
            numeroFactura: movimiento.facturaNumero,
            valor: movimiento.valor,
            fechaEmision: movimiento.fecha,
          }}
          documentoId={movimiento.id}
          documentoNumero={movimiento.reciboNumero}
          asociadoId={movimiento.asociadoId}
          asociadoNombre={movimiento.asociadoNombre}
        />
      )}
    </div>
  );
}
