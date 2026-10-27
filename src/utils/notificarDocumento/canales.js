// Módulo de Notificaciones Inteligentes — capa de canales.
// Construye enlaces "deep link" para abrir WhatsApp, el cliente de correo y SMS
// con el mensaje ya redactado. NUNCA envía nada automáticamente: solo abre la
// app externa con el contenido listo, tal como pide el spec del módulo.

// Normaliza un número de teléfono colombiano a formato internacional sin signos
// (ej. "300 123 4567" -> "573001234567"). Devuelve null si no parece válido.
export function normalizarTelefono(valor) {
  if (!valor) return null;
  const digitos = String(valor).replace(/\D/g, '');
  if (!digitos) return null;

  if (digitos.length === 10 && digitos.startsWith('3')) return `57${digitos}`;
  if (digitos.length === 12 && digitos.startsWith('57')) return digitos;
  if (digitos.length === 7) return null; // fijo local sin indicativo, no válido para WhatsApp/SMS
  // Números fijos con indicativo (ej. 601...) o formatos no estándar: se dejan pasar
  // tal cual si tienen una longitud razonable, para no bloquear casos válidos.
  if (digitos.length >= 10 && digitos.length <= 12) return digitos;
  return null;
}

// Valida un correo electrónico de forma simple (suficiente para uso en UI).
export function esCorreoValido(valor) {
  if (!valor) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(valor).trim());
}

export function construirEnlaceWhatsApp(telefono, mensaje) {
  const numero = normalizarTelefono(telefono);
  if (!numero) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

export function construirEnlaceMailto(correo, asunto, mensaje) {
  if (!esCorreoValido(correo)) return null;
  const params = new URLSearchParams({ subject: asunto || '', body: mensaje || '' });
  // URLSearchParams codifica espacios como "+", los reemplazamos por %20 para mejor
  // compatibilidad con clientes de correo de escritorio.
  return `mailto:${encodeURIComponent(correo)}?${params.toString().replace(/\+/g, '%20')}`;
}

export function construirEnlaceSms(telefono, mensaje) {
  const numero = normalizarTelefono(telefono);
  if (!numero) return null;
  const esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent || '');
  const separador = esIOS ? '&' : '?';
  return `sms:${numero}${separador}body=${encodeURIComponent(mensaje)}`;
}

// Copia texto al portapapeles con fallback para navegadores/contextos sin
// Clipboard API (ej. http sin TLS).
export async function copiarAlPortapapeles(texto) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch {
      // sigue al fallback
    }
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = texto;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    textarea.remove();
    return ok;
  } catch {
    return false;
  }
}

export function abrirEnlace(url) {
  if (!url) return false;
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}
