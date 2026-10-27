import { Receipt, FileText, ExternalLink, Download, Loader2, Ban, MessageCircle, UserRound, CalendarDays } from 'lucide-react';
import { useState } from 'react';
import { RecibosAPI } from '../../api/recibos';
import { useToast } from '../../context/ToastContext';
import { formatCOP } from '../../utils/formatCOP';

function formatFecha(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

// Tarjeta de recibo — verde para facturas, amarillo para multas.
export default function ReciboCard({ recibo, onNotificar }) {
  const { success, error, warning, info } = useToast();
  const [descargando, setDescargando] = useState(false);
  const [cargandoHtml, setCargandoHtml] = useState(false);
  const anulado = recibo.estado === 'ANULADO';
  const esMulta = !recibo.numeroFactura;

  const color = esMulta ? 'amber' : 'emerald';

  const handleVerHtml = async () => {
    setCargandoHtml(true);
    info("Abriendo recibo", "Se está cargando la vista previa...");
    try {
      const html = await RecibosAPI.html(recibo.numeroRecibo);
      const ventana = window.open('', '_blank');
      if (ventana) {
        ventana.document.write(html);
        ventana.document.close();
      } else {
        warning("Ventana bloqueada", "No se pudo abrir el recibo en una nueva pestaña.");
      }
    } catch (err) {
      error("Error al abrir", err.message || 'No se pudo abrir el recibo.');
    } finally {
      setCargandoHtml(false);
    }
  };

  const handleDescargar = async () => {
    setDescargando(true);
    try {
      await RecibosAPI.abrirPdf(recibo.numeroRecibo);
      success('Recibo abierto', 'Usa "Guardar como PDF" en el diálogo de impresión.');
    } catch (err) {
      error("Error al descargar", err.message || 'No se pudo descargar el recibo.');
    } finally {
      setDescargando(false);
    }
  };

  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-xl border p-5 flex flex-col transition-all shadow-sm ${
        anulado
          ? 'border-gray-200 dark:border-dark-muted opacity-75'
          : esMulta
            ? 'border-amber-200 dark:border-amber-800 hover:border-amber-400/60'
            : 'border-gray-200 dark:border-dark-muted hover:border-emerald-400/50'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="min-w-0">
          <h3 className="font-bold text-base leading-tight text-gray-800 dark:text-white truncate flex items-center gap-1.5">
            <Receipt className={`w-4 h-4 shrink-0 ${esMulta ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
            {esMulta ? 'Recibo pago de multa' : recibo.numeroRecibo}
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-1 truncate">
            <CalendarDays className="w-3.5 h-3.5 shrink-0" />
            {formatFecha(recibo.fechaEmision)}
          </span>
        </div>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${
            anulado
              ? 'bg-gray-100 text-gray-500 border-gray-300 dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-600'
              : esMulta
                ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
                : 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
          }`}
        >
          {anulado ? 'ANULADO' : esMulta ? 'MULTA' : 'EMITIDO'}
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-4">
        {recibo.asociadoNombre && (
          <span className="flex items-center gap-1.5 truncate">
            <UserRound className="w-3.5 h-3.5 shrink-0" /> {recibo.asociadoNombre}
          </span>
        )}
        {esMulta ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
            Multa independiente
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 shrink-0" /> {recibo.numeroFactura}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-2.5 text-center border border-gray-200 dark:border-dark-muted">
          <span className="block text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">Método</span>
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200 truncate">{recibo.metodoPago || '—'}</span>
        </div>
        <div className={`rounded-lg p-2.5 text-center border ${
          esMulta
            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
            : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
        }`}>
          <span className={`block text-[10px] mb-0.5 ${esMulta ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>Valor</span>
          <span className={`text-sm font-bold ${esMulta ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'}`}>{formatCOP(recibo.valor)}</span>
        </div>
      </div>

      {Number(recibo.saldoPendiente) > 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mb-3 -mt-1">
          Saldo pendiente en factura: <strong>{formatCOP(recibo.saldoPendiente)}</strong>
        </p>
      )}

      <div className="border-t border-gray-200 dark:border-dark-muted pt-3 flex gap-2">
        <button
          onClick={handleVerHtml}
          disabled={cargandoHtml}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm transition-colors disabled:opacity-60 ${
            esMulta
              ? 'bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300'
              : 'bg-gray-50 dark:bg-gray-950 hover:bg-gray-100 dark:hover:bg-dark-muted text-gray-700 dark:text-white'
          }`}
        >
          {cargandoHtml ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />} Ver recibo
        </button>
        <button
          onClick={handleDescargar}
          disabled={descargando}
          title="Descargar PDF"
          className={`px-3 flex items-center justify-center disabled:opacity-60 rounded-lg transition-colors ${
            esMulta
              ? 'bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-600 dark:text-amber-400'
              : 'bg-gray-50 dark:bg-gray-950 hover:bg-gray-100 dark:hover:bg-dark-muted text-emerald-600 dark:text-emerald-400'
          }`}
        >
          {descargando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
        </button>
        {onNotificar && (
          <button
            onClick={() => onNotificar(recibo)}
            title="Notificar al asociado"
            className="px-3 flex items-center justify-center bg-gray-50 dark:bg-gray-950 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
