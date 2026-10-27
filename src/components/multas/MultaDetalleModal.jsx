import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import { X, ShieldAlert, ExternalLink, FileText, Loader2, Receipt } from 'lucide-react';
import { TesoreriaAPI } from '../../api/tesoreria';
import { RecibosAPI } from '../../api/recibos';
import { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { formatCOP } from '../../utils/formatCOP';

function formatFecha(iso) {
  if (!iso) return '\u2014';
  try {
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

const ESTADO_BADGE = {
  PENDIENTE: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  PAGADA: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  ANULADA: 'bg-gray-100 text-gray-500 border-gray-300 dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-600',
};

const ESTADO_LABEL = {
  PENDIENTE: 'Pendiente',
  PAGADA: 'Pagada',
  ANULADA: 'Anulada',
};

export default function MultaDetalleModal({ open, multa, esAsociado = false, onClose }) {
  useLockBodyScroll(Boolean(open), onClose);
  const { success, error, warning, info } = useToast();
  const [descargandoPdf, setDescargandoPdf] = useState(false);
  const [cargandoRecibo, setCargandoRecibo] = useState(false);

  if (!open || !multa) return null;

  const handleVerHtml = async () => {
    info("Abriendo vista previa.", "Se abrira en una nueva pestana del navegador.");
    try {
      const html = await TesoreriaAPI.verMultaHtml(multa.id);
      const ventana = window.open('', '_blank');
      if (ventana) {
        ventana.document.write(html);
        ventana.document.close();
      } else {
        warning("Ventana bloqueada.", "Verifica que el navegador permita ventanas emergentes.");
      }
    } catch (err) {
      console.error('[MultaDetalleModal] Error al abrir vista previa HTML:', err);
      error("Error al abrir vista previa.", err.message || "Intenta descargar el PDF como alternativa.");
    }
  };

  const handleDescargarPdf = async () => {
    setDescargandoPdf(true);
    try {
      const res = await TesoreriaAPI.descargarMultaPdf(multa.id);
      if (res?.ok) success('PDF listo', 'Usa "Guardar como PDF" en el diálogo de impresión.');
      success("PDF descargado.", "El comprobante de multa se descargo correctamente.");
    } catch (err) {
      console.error('[MultaDetalleModal] Error al descargar PDF:', err);
      error("Error al descargar multa.", err.message || "Verifica tu conexion e intentalo de nuevo.");
    } finally {
      setDescargandoPdf(false);
    }
  };

  const handleVerRecibo = async () => {
    if (!multa.independiente || multa.estado !== 'PAGADA') return;
    setCargandoRecibo(true);
    try {
      const recibo = await RecibosAPI.buscarPorMulta(multa.id);
      if (recibo) {
        const html = await RecibosAPI.html(recibo.numeroRecibo);
        const ventana = window.open('', '_blank');
        if (ventana) {
          ventana.document.write(html);
          ventana.document.close();
        } else {
          warning("Ventana bloqueada.", "Verifica que el navegador permita ventanas emergentes.");
        }
      } else {
        warning("Recibo no encontrado.", "Puede que no se haya generado aun.");
      }
    } catch {
      warning("Recibo no encontrado.", "Contacta a tesoreria.");
    } finally {
      setCargandoRecibo(false);
    }
  };

  return (
    <div className="modal-shell fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="modal-shell__card relative w-full max-w-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease] flex flex-col max-h-[90dvh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="modal-shell__header p-5 border-b border-gray-200 dark:border-dark-muted flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Detalle de Multa</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="modal-shell__body flex-1 overflow-y-auto overscroll-contain p-5 space-y-4">
          {/* Numero y estado */}
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Comprobante de multa</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
              MULTA-{String(multa.id).padStart(6, '0')}
            </p>
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold border ${ESTADO_BADGE[multa.estado] || ESTADO_BADGE.PENDIENTE}`}>
              {ESTADO_LABEL[multa.estado] || multa.estado}
            </span>
            {multa.independiente && (
              <span className="inline-block mt-2 ml-2 px-3 py-1 rounded-full text-xs font-bold border bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800">
                Independiente
              </span>
            )}
          </div>

          {/* Detalle de la multa */}
          <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-xl p-4 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Detalle de la multa</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400 text-xs">Fecha</span>
                <p className="font-semibold text-gray-800 dark:text-white">{formatFecha(multa.fecha)}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400 text-xs">Tipo</span>
                <p className="font-semibold text-gray-800 dark:text-white">{multa.independiente ? 'Independiente' : 'Asociada a factura'}</p>
              </div>
            </div>
            {multa.facturaId && (
              <div>
                <span className="text-gray-500 dark:text-gray-400 text-xs">Factura asociada</span>
                <p className="font-semibold text-gray-800 dark:text-white">FAC-{String(multa.facturaId).padStart(6, '0')}</p>
              </div>
            )}
          </div>

          {/* Motivo */}
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/40 rounded-xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-1">Motivo</p>
            <p className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed">{multa.motivo}</p>
          </div>

          {/* Valor */}
          <div className="bg-amber-50 dark:bg-amber-900/10 border-2 border-amber-400 dark:border-amber-700 rounded-xl p-4 text-center">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-1">Monto de la multa</p>
            <p className="text-3xl font-black text-amber-600 dark:text-amber-400">{formatCOP(multa.valor)}</p>
          </div>

          {/* Acciones */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleVerHtml}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-950 hover:bg-gray-200 dark:hover:bg-dark-muted rounded-lg text-sm font-semibold text-gray-700 dark:text-white transition-colors"
            >
              <ExternalLink className="w-4 h-4" /> Ver en linea
            </button>
            <button
              onClick={handleDescargarPdf}
              disabled={descargandoPdf}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50"
            >
              {descargandoPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              Descargar PDF
            </button>
            {esAsociado && multa.independiente && multa.estado === 'PAGADA' && (
              <button
                onClick={handleVerRecibo}
                disabled={cargandoRecibo}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50"
              >
                {cargandoRecibo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
                Ver recibo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
