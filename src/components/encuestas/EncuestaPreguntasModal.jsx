import SimpleModal from './SimpleModal';
import { TIPOS_PREGUNTA } from '../../api/encuestas';

function esTipoOpciones(tipo) {
  return ['OPCION_UNICA', 'OPCION_MULTIPLE', 'OPCIONES'].includes(tipo);
}

function tipoLabel(tipo) {
  if (tipo === 'OPCION_MULTIPLE') return 'Opciones personalizadas (elige varias)';
  return TIPOS_PREGUNTA.find((t) => t.value === tipo)?.label || tipo;
}

export default function EncuestaPreguntasModal({ encuesta, onClose }) {
  return (
    <SimpleModal
      open={!!encuesta}
      onClose={onClose}
      title={encuesta ? `Preguntas: ${encuesta.titulo}` : 'Preguntas'}
      maxWidth="max-w-lg"
    >
      {encuesta && (
        <div className="space-y-4">
          {(encuesta.preguntas || []).length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">Este formulario aún no tiene preguntas.</p>
          )}
          {(encuesta.preguntas || [])
            .slice()
            .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
            .map((p, i) => (
              <div key={p.id ?? i} className="bg-gray-50 dark:bg-gray-950 p-4 rounded-lg border border-gray-100 dark:border-white/10/50">
                <span className="text-xs text-brand font-bold uppercase tracking-wider mb-1 block">
                  Pregunta {i + 1} {p.obligatoria && <span className="text-red-400">*</span>}
                </span>
                <p className="text-gray-800 dark:text-white mb-2">{p.texto}</p>
                <div className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 bg-gray-100 dark:bg-dark-muted rounded w-max">
                  Tipo: {tipoLabel(p.tipo)}
                </div>
                {esTipoOpciones(p.tipo) && (p.opciones || []).length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {p.opciones.map((op, idx) => (
                      <li key={idx} className="text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                        {op}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
        </div>
      )}
    </SimpleModal>
  );
}
