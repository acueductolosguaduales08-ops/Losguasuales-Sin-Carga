// Historial de notificaciones — almacenado en localStorage mientras no exista
// un endpoint de backend para persistirlo (ver nota en el README del módulo).
// Cada entrada refleja únicamente que el mensaje fue PREPARADO, COPIADO o
// ABIERTO en la app externa — nunca "Enviado", porque el envío final lo hace
// el usuario desde WhatsApp/Gmail/SMS.

const STORAGE_KEY = 'acueducto_notif_historial';
const MAX_ENTRADAS = 500;

export const ESTADOS_HISTORIAL = {
  PREPARADA: 'Preparada',
  COPIADA: 'Copiada',
  WHATSAPP: 'Abierta en WhatsApp',
  GMAIL: 'Abierta en Gmail',
  SMS: 'Abierta en SMS',
};

function leerTodo() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function guardarTodo(lista) {
  try {
    const recortada = lista.slice(-MAX_ENTRADAS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recortada));
  } catch {
    // almacenamiento no disponible (modo privado, cuota llena, etc.) — se ignora
  }
}

// entry: { tipoDocumento, documentoId, documentoNumero, asociadoNombre, canal,
//          destinatario, usuario, estado }
export function registrarHistorial(entry) {
  const lista = leerTodo();
  const nueva = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    fecha: new Date().toISOString(),
    ...entry,
  };
  lista.push(nueva);
  guardarTodo(lista);
  return nueva;
}

export function listarHistorial({ tipoDocumento, documentoId } = {}) {
  return leerTodo()
    .filter((e) => (tipoDocumento ? e.tipoDocumento === tipoDocumento : true))
    .filter((e) => (documentoId ? e.documentoId === documentoId : true))
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}

export function limpiarHistorial() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // se ignora
  }
}
