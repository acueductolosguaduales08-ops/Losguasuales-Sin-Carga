import { useEffect, useState } from 'react';
import { Loader2, User, ChevronDown, ChevronUp, BarChart2 } from 'lucide-react';
import SimpleModal from './SimpleModal';
import { EncuestasAPI } from '../../api/encuestas';
import { useToast } from '../../context/ToastContext';

function agruparRespuestasPorPregunta(respuestas) {
  const porPregunta = new Map();

  (respuestas || []).forEach((persona) => {
    (persona.respuestas || []).forEach((r) => {
      const valor = (r.valor ?? '').toString().trim();
      if (!valor) return;
      const clave = valor.toLowerCase();

      if (!porPregunta.has(r.preguntaId)) {
        porPregunta.set(r.preguntaId, { texto: r.pregunta, conteos: new Map(), total: 0 });
      }
      const entrada = porPregunta.get(r.preguntaId);
      entrada.conteos.set(clave, (entrada.conteos.get(clave) || 0) + 1);
      entrada.total++;
    });
  });

  return Array.from(porPregunta.values());
}

export default function EncuestaRespuestasModal({ encuesta, onClose }) {
  const [respuestas, setRespuestas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandida, setExpandida] = useState(null);
  const { info } = useToast();

  useEffect(() => {
    if (!encuesta) return;
    setRespuestas([]);
    setLoading(true);
    EncuestasAPI.respuestas(encuesta.id)
      .then(setRespuestas)
      .catch(() => info("Error al cargar.", "No se pudieron obtener las respuestas de la encuesta."))
      .finally(() => setLoading(false));
  }, [encuesta]);

  const agrupadas = agruparRespuestasPorPregunta(respuestas);

  return (
    <SimpleModal
      open={!!encuesta}
      onClose={onClose}
      title={encuesta ? `Respuestas: ${encuesta.titulo}` : 'Respuestas'}
      maxWidth="max-w-lg"
    >
      {loading && (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}

      {!loading && respuestas.length === 0 && (
        <p className="text-sm text-gray-400 py-6 text-center">Aún no hay respuestas registradas.</p>
      )}

      {!loading && agrupadas.length > 0 && (
        <div className="space-y-3">
          {agrupadas.map((pregunta, idx) => (
            <div key={idx} className="bg-gray-50 dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => setExpandida(expandida === idx ? null : idx)}
                className="w-full flex items-center justify-between p-3 text-left"
              >
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{pregunta.texto}</span>
                <span className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-xs text-gray-400">{pregunta.total} rta{pregunta.total === 1 ? '' : 's'}</span>
                  {expandida === idx ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </span>
              </button>
              {expandida === idx && (
                <div className="px-3 pb-3 space-y-1">
                  {Array.from(pregunta.conteos.entries())
                    .sort((a, b) => b[1] - a[1])
                    .map(([valor, count]) => (
                      <div key={valor} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-white dark:bg-gray-800">
                        <span className="text-gray-600 dark:text-gray-300 truncate">{valor}</span>
                        <span className="font-bold text-brand shrink-0 ml-2">{count}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && respuestas.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-white/10 flex items-center gap-2 text-sm text-gray-500">
          <User className="w-4 h-4" />
          <span>{respuestas.length} persona{respuestas.length === 1 ? '' : 's'} respondieron</span>
        </div>
      )}
    </SimpleModal>
  );
}
