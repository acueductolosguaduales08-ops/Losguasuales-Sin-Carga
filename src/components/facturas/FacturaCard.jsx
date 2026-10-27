import { FileText, UserRound, Gauge, CalendarDays, Eye, Ban, PlusCircle, Download, Loader2, MessageCircle } from 'lucide-react';
import { formatCOP } from '../../utils/formatCOP';

function formatFecha(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

const ESTADO_BADGE = {
  PENDIENTE: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  PAGADA_PARCIAL: 'bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800',
  PAGADA: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  VENCIDA: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  ANULADA: 'bg-gray-100 text-gray-500 border-gray-300 dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-600',
};

const ESTADO_LABEL = {
  PENDIENTE: 'Pendiente',
  PAGADA_PARCIAL: 'Pago parcial',
  PAGADA: 'Pagada',
  VENCIDA: 'Vencida',
  ANULADA: 'Anulada',
};

export default function FacturaCard({ factura, onVerDetalle, onAgregarConcepto, onAnular, onDescargarPdf, onNotificar, descargandoPdf = false, mostrarAsociado = true }) {
  const anulada = factura.estado === 'ANULADA';

  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-xl border p-5 flex flex-col transition-all shadow-sm ${
        anulada ? 'border-gray-200 dark:border-dark-muted opacity-75' : 'border-gray-200 dark:border-dark-muted hover:border-brand/50'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="min-w-0">
          <h3 className="font-bold text-base leading-tight text-gray-800 dark:text-white truncate flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-brand/70 shrink-0" />
            {factura.numeroFactura}
          </h3>
          {mostrarAsociado && (
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-1 truncate">
              <UserRound className="w-3.5 h-3.5 shrink-0" />
              {factura.asociadoNombre}
            </span>
          )}
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${ESTADO_BADGE[factura.estado] || ESTADO_BADGE.PENDIENTE}`}>
          {ESTADO_LABEL[factura.estado] || factura.estado}
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-4">
        <span className="flex items-center gap-1.5">
          <Gauge className="w-3.5 h-3.5 shrink-0" /> {factura.numeroMedidor}
        </span>
        <span className="flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5 shrink-0" /> {formatFecha(factura.fechaEmision)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-2.5 text-center border border-gray-200 dark:border-dark-muted">
          <span className="block text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">Consumo</span>
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{factura.consumoM3} m³</span>
        </div>
        <div className="bg-brand/10 rounded-lg p-2.5 text-center border border-brand/30">
          <span className="block text-[10px] text-brand dark:text-brand-light mb-0.5">Total</span>
          <span className="text-sm font-bold text-brand">{formatCOP(factura.total)}</span>
        </div>
      </div>

      {!anulada && factura.saldoPendiente > 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mb-3 -mt-1">
          Saldo pendiente: <strong>{formatCOP(factura.saldoPendiente)}</strong>
        </p>
      )}

      <div className="border-t border-gray-200 dark:border-dark-muted pt-3 flex gap-2">
        <button
          onClick={() => onVerDetalle(factura)}
          className="flex-1 flex items-center justify-center gap-1.5 bg-gray-50 dark:bg-gray-950 hover:bg-gray-100 dark:hover:bg-dark-muted py-2 rounded-lg text-sm text-gray-700 dark:text-white transition-colors"
        >
          <Eye className="w-4 h-4" /> Detalles
        </button>
        {onDescargarPdf && (
          <button
            onClick={() => onDescargarPdf(factura)}
            disabled={descargandoPdf}
            title="Descargar PDF"
            className="px-3 flex items-center justify-center bg-gray-50 dark:bg-gray-950 hover:bg-gray-100 dark:hover:bg-dark-muted disabled:opacity-60 rounded-lg text-sky-600 dark:text-sky-400 transition-colors"
          >
            {descargandoPdf ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
          </button>
        )}
        {onNotificar && (
          <button
            onClick={() => onNotificar(factura)}
            title="Notificar al asociado"
            className="px-3 flex items-center justify-center bg-gray-50 dark:bg-gray-950 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
        )}
        {onAgregarConcepto && !anulada && (
          <button
            onClick={() => onAgregarConcepto(factura)}
            title="Agregar concepto adicional"
            className="px-3 flex items-center justify-center bg-gray-50 dark:bg-gray-950 hover:bg-gray-100 dark:hover:bg-dark-muted rounded-lg text-brand transition-colors"
          >
            <PlusCircle className="w-5 h-5" />
          </button>
        )}
        {onAnular && !anulada && (
          <button
            onClick={() => onAnular(factura)}
            title="Anular factura"
            className="px-3 flex items-center justify-center bg-gray-50 dark:bg-gray-950 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 transition-colors"
          >
            <Ban className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
