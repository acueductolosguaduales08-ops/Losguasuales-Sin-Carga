// Utilidades para mostrar notificaciones "fuera de la página" — es decir,
// notificaciones del sistema operativo / navegador, además del aviso que ya
// se muestra dentro de la app (toast + campanita).
//
// Importante: esto NO es un push real (no hay servidor de push ni VAPID/FCM
// en el backend de este proyecto). Lo que hace es mostrar una notificación
// del sistema en el navegador del propio usuario cuando su sesión detecta
// una notificación nueva (el sondeo/polling que ya existe en
// NotificationsContext). Para que un usuario las reciba, su navegador debe
// tener el permiso de notificaciones concedido y la app/pestaña debe estar
// abierta (o instalada como PWA en segundo plano).

const SW_URL = '/sw-notificaciones.js';
export const LOGO_POR_DEFECTO = '/logo-losguaduales.png';

let registrationPromise = null;

export function soportaNotificacionesSistema() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

// 'default' (no preguntado) | 'granted' | 'denied' | 'unsupported'
export function permisoNotificaciones() {
  if (!soportaNotificacionesSistema()) return 'unsupported';
  return Notification.permission;
}

export async function registrarServiceWorker() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;
  if (!registrationPromise) {
    registrationPromise = navigator.serviceWorker.register(SW_URL).catch(() => null);
  }
  return registrationPromise;
}

export async function solicitarPermisoNotificaciones() {
  if (!soportaNotificacionesSistema()) return 'unsupported';
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

// Muestra una notificación del sistema con logo (icon), texto (title/body)
// e imagen por URL (image). Usa el Service Worker cuando está disponible
// (necesario en varios navegadores para que se vea la imagen enriquecida);
// si no hay SW, cae de vuelta a la Notification API simple (solo ícono).
export async function mostrarNotificacionSistema({
  id,
  titulo,
  cuerpo,
  imagen,
  icono = LOGO_POR_DEFECTO,
  url = '/',
}) {
  if (!soportaNotificacionesSistema() || Notification.permission !== 'granted') return false;

  const opciones = {
    body: cuerpo || '',
    icon: icono,
    badge: icono,
    ...(imagen ? { image: imagen } : {}),
    tag: id != null ? `acueducto-notificacion-${id}` : undefined,
    data: { url },
  };

  try {
    await registrarServiceWorker();
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(titulo || 'Notificación', opciones);
      return true;
    }
  } catch {
    // sigue al fallback de abajo
  }

  try {
    // eslint-disable-next-line no-new
    new Notification(titulo || 'Notificación', opciones);
    return true;
  } catch {
    return false;
  }
}
