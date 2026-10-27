import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import SimpleModal from './SimpleModal';
import { EncuestasAPI } from '../../api/encuestas';
import { useToast } from '../../context/ToastContext';

export default function EncuestaStatsModal({ encuesta, onClose }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const { info } = useToast();

  useEffect(() => {
    if (!encuesta) return;
    setStats(null);
    setLoading(true);
    EncuestasAPI.estadisticas(encuesta.id)
      .then(setStats)
      .catch(() => info("Error al cargar.", "No se pudieron obtener las estadísticas de la encuesta."))
      .finally(() => setLoading(false));
  }, [encuesta]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SimpleModal
      open={!!encuesta}
      onClose={onClose}
      title={encuesta ? `Estadísticas: ${encuesta.titulo}` : 'Estadísticas'}
      maxWidth="max-w-md"
    >
      {loading && (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}

      {!loading && stats && (
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-950 p-4 rounded-lg flex justify-between items-center border border-brand/20">
            <span className="text-gray-500 dark:text-gray-400">Total respuestas</span>
            <span className="text-2xl font-bold text-brand">{stats.totalRespuestas ?? 0}</span>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold border-b border-gray-200 dark:border-white/10 pb-2 text-gray-700 dark:text-gray-200">
              Resumen por pregunta
            </h4>
            {Object.entries(stats.resumenPorPregunta || {}).length === 0 && (
              <p className="text-sm text-gray-400 py-3">Aún no hay respuestas registradas</p>
            )}
            {Object.entries(stats.resumenPorPregunta || {}).map(([pregunta, total]) => (
              <div key={pregunta} className="bg-gray-50 dark:bg-gray-950 p-3 rounded text-sm flex justify-between gap-2">
                <span className="truncate pr-2 text-gray-700 dark:text-gray-200">{pregunta}</span>
                <span className="font-bold text-brand shrink-0">
                  {total} rta{total === 1 ? '' : 's'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </SimpleModal>
  );
}
