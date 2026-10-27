import { ConfiguracionAPI } from '../../api/configuracion';

// Preferencias de redacción del módulo de notificaciones (guardadas localmente).
// Los datos "duros" del acueducto (nombre, teléfono, correo, cuenta bancaria)
// se toman de ConfiguracionAPI, que ya existe en el sistema — aquí solo se
// guarda lo específico de cómo se redactan los mensajes.
const STORAGE_KEY = 'acueducto_notif_prefs';

const DEFAULTS = {
  saludo: 'Hola',
  usarEmojis: true,
  firma: '', // si está vacío, se arma automáticamente con el nombre del acueducto
  horarioAtencion: '',
  incluirInstruccionesPago: true,
};

export function obtenerPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

export function guardarPrefs(parcial) {
  const actuales = obtenerPrefs();
  const nuevas = { ...actuales, ...parcial };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevas));
  } catch {
    // se ignora si el almacenamiento no está disponible
  }
  return nuevas;
}

// --- Caché en memoria de la configuración institucional (nombre, contacto, cuenta) ---
let cacheConfig = null;
let cachePromesa = null;

export async function obtenerConfigInstitucional({ forzar = false } = {}) {
  if (cacheConfig && !forzar) return cacheConfig;
  if (cachePromesa && !forzar) return cachePromesa;

  cachePromesa = ConfiguracionAPI.obtener()
    .then((data) => {
      cacheConfig = data || {};
      return cacheConfig;
    })
    .catch(() => ({}))
    .finally(() => {
      cachePromesa = null;
    });

  return cachePromesa;
}
