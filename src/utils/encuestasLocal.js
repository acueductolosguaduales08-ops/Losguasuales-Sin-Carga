// Control 100% local (localStorage) para la función "responder una sola vez" de las encuestas.
// El backend guarda el campo "respuestaUnica" en cada encuesta (se define al crearla), pero no lleva
// registro de quién responde cada una. Por eso, cuando una encuesta tiene respuestaUnica=true, este
// navegador recuerda localmente que ya se respondió, para bloquear un segundo intento.

const KEY_RESPONDIDAS = 'acueducto_encuestas_respondidas';

function leerRespondidas() {
  try {
    return JSON.parse(localStorage.getItem(KEY_RESPONDIDAS)) || [];
  } catch {
    return [];
  }
}

// true si este navegador ya envió una respuesta para la encuesta indicada.
export function yaRespondioEncuesta(encuestaId) {
  if (encuestaId === undefined || encuestaId === null) return false;
  return leerRespondidas().includes(encuestaId);
}

// Marca la encuesta como respondida en este navegador.
export function marcarEncuestaRespondida(encuestaId) {
  if (encuestaId === undefined || encuestaId === null) return;
  const actuales = leerRespondidas();
  if (!actuales.includes(encuestaId)) {
    localStorage.setItem(KEY_RESPONDIDAS, JSON.stringify([...actuales, encuestaId]));
  }
}
