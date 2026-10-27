import { Calendar, QrCode, ListChecks, BarChart3, Archive, Loader2, ClipboardCheck } from 'lucide-react';

function formatFechaCorta(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
  } catch {
    return iso;
  }
}

export default function EncuestaAdminCard({ encuesta, busy, onToggleActiva, onShowQr, onShowPreguntas, onShowStats, onShowRespuestas, onArchivar }) {
  const activa = encuesta.estado === 'ACTIVA';
  const archivada = encuesta.estado === 'ARCHIVADA';

  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-xl border p-5 flex flex-col transition-colors ${
        archivada
          ? 'border-gray-200 dark:border-white/10/40 opacity-60 saturate-50 grayscale-[0.35] hover:opacity-85'
          : 'border-gray-100 dark:border-white/10/60 hover:border-brand/50'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-950 px-2 py-1 rounded w-max">
              {encuesta.codigo}
            </span>
            {archivada && (
              <span className="text-xs font-semibold bg-gray-200 dark:bg-dark-muted text-gray-500 dark:text-gray-400 px-2 py-1 rounded">
                Archivado
              </span>
            )}
          </div>
          <h3 className="font-bold text-lg leading-tight text-gray-800 dark:text-white">{encuesta.titulo}</h3>
        </div>

        {!archivada && (
          <label className="relative inline-flex items-center cursor-pointer shrink-0" title="Activar/Desactivar">
            <input
              type="checkbox"
              checked={activa}
              onChange={() => onToggleActiva(encuesta)}
              disabled={busy}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 dark:bg-dark-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand" />
          </label>
        )}
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex-grow">{encuesta.descripcion}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {encuesta.fechaFin && (
          <span className="text-xs bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-400 px-2 py-1 rounded flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Fin: {formatFechaCorta(encuesta.fechaFin)}
          </span>
        )}
        <span className="text-xs bg-gray-50 dark:bg-gray-950 text-brand px-2 py-1 rounded">
          {encuesta.publico ? 'Público' : 'Privado'}
        </span>
      </div>

      <div className="border-t border-gray-100 dark:border-white/10 pt-4 flex justify-between gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => onShowQr(encuesta)}
            title="Compartir QR"
            className="p-2 bg-gray-50 dark:bg-gray-950 hover:bg-gray-100 dark:hover:bg-dark-muted rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
          >
            <QrCode className="w-5 h-5" />
          </button>
          <button
            onClick={() => onShowPreguntas(encuesta)}
            title="Ver preguntas"
            className="p-2 bg-gray-50 dark:bg-gray-950 hover:bg-gray-100 dark:hover:bg-dark-muted rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
          >
            <ListChecks className="w-5 h-5" />
          </button>
          <button
            onClick={() => onShowStats(encuesta)}
            title="Estadísticas"
            className="p-2 bg-gray-50 dark:bg-gray-950 hover:bg-gray-100 dark:hover:bg-dark-muted rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
          >
            <BarChart3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => onShowRespuestas(encuesta)}
            title="Ver respuestas"
            className="p-2 bg-gray-50 dark:bg-gray-950 hover:bg-gray-100 dark:hover:bg-dark-muted rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
          >
            <ClipboardCheck className="w-5 h-5" />
          </button>
        </div>
        {!archivada && (
          <button
            onClick={() => onArchivar(encuesta)}
            disabled={busy}
            title="Archivar"
            className="p-2 bg-gray-50 dark:bg-gray-950 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-red-400 hover:text-red-500 dark:hover:text-red-300 transition-colors disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Archive className="w-5 h-5" />}
          </button>
        )}
      </div>
    </div>
  );
}
