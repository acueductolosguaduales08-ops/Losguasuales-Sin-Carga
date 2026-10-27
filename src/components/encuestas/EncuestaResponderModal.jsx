import { useEffect, useState } from 'react';
import { Loader2, Star, CheckCircle2, Lock } from 'lucide-react';
import SimpleModal from './SimpleModal';
import { EncuestasAPI } from '../../api/encuestas';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { yaRespondioEncuesta, marcarEncuestaRespondida } from '../../utils/encuestasLocal';

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="text-amber-400"
        >
          <Star className="w-6 h-6" fill={n <= (hover || value) ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  );
}

export default function EncuestaResponderModal({ encuesta, onClose, onResponded }) {
  const [respuestas, setRespuestas] = useState({});
  const [nombre, setNombre] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const { success, error, warning, info } = useToast();
  const { usuario, isAuthenticated } = useAuth();

  // true si la encuesta es anónima (no pide nombre)
  const esAnonima = encuesta?.respuestasAnonimas === true || encuesta?.anonimas === true;
  // Si hay sesión, usar el nombre del usuario automáticamente
  const nombreAutomatic = isAuthenticated ? (usuario?.username || usuario?.nombre || '') : '';
  // Pedir nombre si no es anónima y no hay sesión
  const pedirNombre = !esAnonima && !isAuthenticated;
  // Si la encuesta tiene activada "respuesta única" (definido al crearla) y este navegador ya la respondió
  const yaRespondida = encuesta?.respuestaUnica === true && yaRespondioEncuesta(encuesta?.id);

  useEffect(() => {
    if (encuesta) {
      setRespuestas({});
      setNombre('');
      setEnviado(false);
    }
  }, [encuesta]);

  if (!encuesta) return null;

  const preguntasOrdenadas = (encuesta.preguntas || []).slice().sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

  const setRespuesta = (preguntaId, valor) => setRespuestas((prev) => ({ ...prev, [preguntaId]: valor }));

  // Para OPCION_MULTIPLE, respuestas[preguntaId] es un array: se agrega o
  // quita la opción marcada, en vez de reemplazar el valor completo como
  // hacen los demás tipos de pregunta.
  const toggleOpcionMultiple = (preguntaId, opcion) => {
    setRespuestas((prev) => {
      const actuales = Array.isArray(prev[preguntaId]) ? prev[preguntaId] : [];
      const yaMarcada = actuales.includes(opcion);
      return {
        ...prev,
        [preguntaId]: yaMarcada ? actuales.filter((o) => o !== opcion) : [...actuales, opcion],
      };
    });
  };

  const preguntaSinResponder = (p) => {
    const valor = respuestas[p.id];
    if (p.tipo === 'OPCION_MULTIPLE') return !Array.isArray(valor) || valor.length === 0;
    return valor === undefined || valor === '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const faltantes = preguntasOrdenadas.filter((p) => p.obligatoria && preguntaSinResponder(p));
    if (faltantes.length > 0) {
      warning("Preguntas pendientes.", "Debes responder todas las preguntas obligatorias.");
      return;
    }
    if (pedirNombre && !nombre.trim()) {
      warning("Nombre requerido.", "Debes ingresar tu nombre para continuar.");
      return;
    }

    setEnviando(true);
    try {
      const nombreFinal = esAnonima ? undefined : (nombreAutomatic || nombre.trim() || undefined);
      const payload = {
        ...(nombreFinal ? { nombre: nombreFinal } : {}),
        // OPCION_MULTIPLE: un item por cada opción marcada, mismo
        // preguntaId, distinto valor — así lo espera el backend. El resto
        // de tipos sigue mandando un único item, como siempre.
        respuestas: preguntasOrdenadas.flatMap((p) => {
          if (p.tipo === 'OPCION_MULTIPLE') {
            const seleccionadas = Array.isArray(respuestas[p.id]) ? respuestas[p.id] : [];
            return seleccionadas.map((valor) => ({ preguntaId: p.id, valor }));
          }
          return [{ preguntaId: p.id, valor: respuestas[p.id] ?? '' }];
        }),
      };
      await EncuestasAPI.responder(encuesta.id, payload);
      if (encuesta.respuestaUnica === true) marcarEncuestaRespondida(encuesta.id);
      setEnviado(true);
      onResponded?.();
    } catch (err) {
      error("Error al enviar.", err.message || 'No se pudo enviar tu respuesta.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <SimpleModal
      open={!!encuesta}
      onClose={onClose}
      title={encuesta.titulo}
      maxWidth="max-w-xl"
      footer={
        !enviado &&
        !yaRespondida && (
          <>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-muted text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-dark-muted/70 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={enviando}
              className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-dark disabled:opacity-60 text-white transition-colors flex items-center gap-2"
            >
              {enviando && <Loader2 className="w-4 h-4 animate-spin" />}
              {enviando ? 'Enviando…' : 'Enviar respuestas'}
            </button>
          </>
        )
      }
    >
      {yaRespondida ? (
        <div className="flex flex-col items-center py-10 text-center">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-500 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-amber-600 dark:text-amber-400">Encuesta ya respondida</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Este formulario solo admite una respuesta por persona y ya enviaste la tuya desde este dispositivo.
          </p>
        </div>
      ) : enviado ? (
        <div className="flex flex-col items-center py-10 text-center">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">¡Gracias por participar!</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tu respuesta fue enviada correctamente.</p>
        </div>
      ) : (
        <>
          {encuesta.descripcion && <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{encuesta.descripcion}</p>}

          {/* Nombre del respondiente */}
          {pedirNombre && (
            <div className="mb-5 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
              <label className="block text-sm font-semibold text-gray-800 dark:text-white mb-1.5">
                Tu nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="¿Cómo te llamas?"
                className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2 text-gray-800 dark:text-white outline-none focus:border-brand text-sm"
              />
            </div>
          )}
          {!esAnonima && isAuthenticated && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
              Respondiendo como <span className="font-semibold text-brand">{nombreAutomatic}</span>
            </p>
          )}

          <div className="space-y-6">
            {preguntasOrdenadas.map((p) => (
              <div key={p.id}>
                <label className="block text-base mb-2 text-gray-800 dark:text-white">
                  {p.texto} {p.obligatoria && <span className="text-red-500">*</span>}
                </label>

                {p.tipo === 'TEXTO_CORTO' && (
                  <input
                    type="text"
                    value={respuestas[p.id] || ''}
                    onChange={(e) => setRespuesta(p.id, e.target.value)}
                    placeholder="Tu respuesta"
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2 text-gray-800 dark:text-white outline-none focus:border-brand"
                  />
                )}

                {p.tipo === 'TEXTO_LARGO' && (
                  <textarea
                    value={respuestas[p.id] || ''}
                    onChange={(e) => setRespuesta(p.id, e.target.value)}
                    placeholder="Tu respuesta"
                    rows={4}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2 text-gray-800 dark:text-white outline-none focus:border-brand resize-none"
                  />
                )}

                {p.tipo === 'SI_NO' && (
                  <div className="flex gap-3">
                    {['Sí', 'No'].map((op) => (
                      <button
                        key={op}
                        type="button"
                        onClick={() => setRespuesta(p.id, op)}
                        className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                          respuestas[p.id] === op
                            ? 'bg-brand text-white'
                            : 'bg-gray-50 dark:bg-gray-950 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10'
                        }`}
                      >
                        {op}
                      </button>
                    ))}
                  </div>
                )}

                {['ESCALA', 'ESTRELLAS'].includes(p.tipo) && (
                  <StarRating value={respuestas[p.id] || 0} onChange={(v) => setRespuesta(p.id, v)} />
                )}

                {['OPCION_UNICA', 'OPCIONES'].includes(p.tipo) && (
                  <div className="space-y-2">
                    {(p.opciones || []).map((op) => (
                      <button
                        key={op}
                        type="button"
                        onClick={() => setRespuesta(p.id, op)}
                        className={`w-full text-left px-4 py-2 rounded-lg border transition-colors ${
                          respuestas[p.id] === op
                            ? 'bg-brand/10 border-brand text-brand-dark dark:text-brand-light'
                            : 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {op}
                      </button>
                    ))}
                  </div>
                )}

                {p.tipo === 'OPCION_MULTIPLE' && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-400 dark:text-gray-500 -mt-1 mb-1">
                      Puedes marcar más de una opción.
                    </p>
                    {(p.opciones || []).map((op) => {
                      const marcada = Array.isArray(respuestas[p.id]) && respuestas[p.id].includes(op);
                      return (
                        <button
                          key={op}
                          type="button"
                          onClick={() => toggleOpcionMultiple(p.id, op)}
                          aria-pressed={marcada}
                          className={`w-full flex items-center gap-2.5 text-left px-4 py-2 rounded-lg border transition-colors ${
                            marcada
                              ? 'bg-brand/10 border-brand text-brand-dark dark:text-brand-light'
                              : 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300'
                          }`}
                        >
                          <span
                            className={`shrink-0 w-4 h-4 rounded flex items-center justify-center border-2 ${
                              marcada ? 'bg-brand border-brand' : 'border-gray-300 dark:border-gray-600'
                            }`}
                          >
                            {marcada && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                          </span>
                          {op}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </SimpleModal>
  );
}
