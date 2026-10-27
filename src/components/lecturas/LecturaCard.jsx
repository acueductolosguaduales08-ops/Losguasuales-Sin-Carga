import { Gauge, UserRound, CalendarDays, Droplet, Pencil, Lock, History, Trash2, FileText } from 'lucide-react';

function formatFecha(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

export default function LecturaCard({ lectura, onEditar, onVerHistorial, onEliminar, onGenerarFactura, facturando }) {
  const bloqueada = lectura.facturaGenerada;

  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-xl border p-5 flex flex-col transition-all shadow-sm ${
        bloqueada
          ? 'border-gray-200 dark:border-dark-muted opacity-90'
          : 'border-gray-200 dark:border-dark-muted hover:border-brand/50'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="min-w-0">
          <h3 className="font-bold text-base leading-tight text-gray-800 dark:text-white truncate flex items-center gap-1.5">
            <UserRound className="w-4 h-4 text-brand/70 shrink-0" />
            {lectura.asociadoNombre || `Asociado #${lectura.asociadoId}`}
          </h3>
          <span className="text-xs font-mono text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-1">
            <Gauge className="w-3.5 h-3.5 shrink-0" />
            Medidor: {lectura.numeroMedidor || lectura.medidorId}
          </span>
        </div>
        {bloqueada ? (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-600 flex items-center gap-1">
            <Lock className="w-3 h-3" /> Facturada
          </span>
        ) : (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
            Editable
          </span>
        )}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-4">
        <CalendarDays className="w-3.5 h-3.5 shrink-0" />
        Lectura del {formatFecha(lectura.fechaLectura)}
      </p>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-2.5 text-center border border-gray-200 dark:border-dark-muted">
          <span className="block text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">Anterior</span>
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{lectura.lecturaAnterior ?? '—'}</span>
        </div>
        <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-2.5 text-center border border-gray-200 dark:border-dark-muted">
          <span className="block text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">Actual</span>
          <span className="text-sm font-bold text-gray-800 dark:text-white">{lectura.lecturaActual}</span>
        </div>
        <div className="bg-brand/10 rounded-lg p-2.5 text-center border border-brand/30">
          <span className="block text-[10px] text-brand dark:text-brand-light mb-0.5 flex items-center justify-center gap-0.5">
            <Droplet className="w-2.5 h-2.5" /> Consumo
          </span>
          <span className="text-sm font-bold text-brand">{lectura.consumoM3} m³</span>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-dark-muted pt-3 flex gap-2">
        {!bloqueada && onGenerarFactura && (
          <button
            onClick={() => onGenerarFactura(lectura)}
            disabled={facturando}
            title="Generar la factura de esta lectura"
            className="flex-1 flex items-center justify-center gap-1.5 bg-brand hover:bg-brand-dark disabled:opacity-60 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
          >
            <FileText className="w-4 h-4" /> Facturar
          </button>
        )}
        <button
          onClick={() => onVerHistorial(lectura)}
          className="flex-1 flex items-center justify-center gap-1.5 bg-gray-50 dark:bg-gray-950 hover:bg-gray-100 dark:hover:bg-dark-muted py-2 rounded-lg text-sm text-gray-700 dark:text-white transition-colors"
        >
          <History className="w-4 h-4" /> Historial
        </button>
        <button
          onClick={() => onEditar(lectura)}
          disabled={bloqueada}
          title={bloqueada ? 'No editable: ya generó factura' : 'Editar lectura'}
          className="px-3 flex items-center justify-center bg-gray-50 dark:bg-gray-950 hover:bg-gray-100 dark:hover:bg-dark-muted disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-brand transition-colors"
        >
          <Pencil className="w-5 h-5" />
        </button>
        <button
          onClick={() => onEliminar?.(lectura)}
          disabled={bloqueada}
          title={bloqueada ? 'No eliminable: ya generó factura' : 'Eliminar lectura'}
          className="px-3 flex items-center justify-center bg-gray-50 dark:bg-gray-950 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-gray-400 hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
