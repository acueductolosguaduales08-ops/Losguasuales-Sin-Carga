import { useEffect, useLayoutEffect } from 'react';

// Selector de elementos que pueden recibir foco por teclado. Se usa tanto
// para enfocar el primer control al abrir el modal como para ciclar el
// foco (Tab / Shift+Tab) sin que se escape hacia el contenido de fondo.
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Bloquea el scroll del fondo mientras `active` sea true (modal, menu, etc.)
// y, si se pasa `onClose`, cierra el modal al presionar la tecla Escape.
// También mantiene el foco de teclado dentro del modal (focus trap) y lo
// devuelve al elemento que lo abrió cuando se cierra.
//
// Por que `overflow: hidden` en html/body NO basta en movil:
// En iOS Safari y varios navegadores Android, `overflow:hidden` en html/body
// no impide el gesto tactil de scroll/rebote del documento: el usuario puede
// seguir arrastrando el dedo y el navegador desplaza (o "rebota") la pagina
// completa por debajo del modal. Eso es exactamente lo que se percibia como
// "el modal no hace scroll" o "el fondo se ve como otra seccion": el gesto
// tactil lo estaba consumiendo el <body>, no el contenedor interno del modal.
//
// La tecnica que si funciona de forma consistente en iOS y Android es fijar
// el <body> en su lugar exacto con `position: fixed` (usando `top` negativo
// igual al scroll actual) mientras el modal esta abierto, y al cerrar
// restaurar el scroll de forma INSTANTANEA (sin smooth-scroll) a la misma
// posicion. Como el body nunca cambia de tamano ni de posicion visual en el
// proceso, no hay salto perceptible ni "vuelta al Hero".
//
// El segundo parametro `onClose` es opcional: los modales que ya llamaban
// useLockBodyScroll(active) sin el segundo argumento siguen funcionando
// exactamente igual (sin cierre por teclado). Pasar `onClose` es la forma
// recomendada de que un modal sea accesible por teclado sin tener que
// repetir el mismo listener de keydown en cada componente.
export default function useLockBodyScroll(active, onClose) {
  useLayoutEffect(() => {
    if (!active) return undefined;

    const html = document.documentElement;
    const { body } = document;
    const scrollY = window.scrollY || html.scrollTop || 0;

    // Guarda el comportamiento de scroll para desactivar el "smooth" al
    // restaurar (si no, el salto de vuelta se ve animado y raro).
    const previousScrollBehavior = html.style.scrollBehavior;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflowY: body.style.overflowY,
    };

    html.style.scrollBehavior = 'auto';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    // Evita el "salto" horizontal si el body tenia scrollbar antes de fijarlo.
    body.style.overflowY = 'scroll';

    return () => {
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.left = previous.left;
      body.style.right = previous.right;
      body.style.width = previous.width;
      body.style.overflowY = previous.overflowY;

      // Restaura la posicion exacta, sin animacion, antes de reactivar
      // scroll-behavior: smooth (que solo debe afectar navegacion normal).
      window.scrollTo(0, scrollY);
      html.style.scrollBehavior = previousScrollBehavior;
    };
  }, [active]);

  useEffect(() => {
    if (!active || typeof onClose !== 'function') return undefined;
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active, onClose]);

  // Focus trap + devolver el foco al elemento que abrió el modal.
  //
  // Se apoya en la clase `.modal-shell`, que ya está presente en el
  // overlay raíz de prácticamente todos los modales del proyecto. Al
  // activarse, toma SIEMPRE el último `.modal-shell` presente en el DOM:
  // como los modales anidados (ej. un ConfirmDialog de "¿descartar
  // cambios?" abierto encima de un formulario) se renderizan como
  // descendientes del modal padre, quedan después en el orden del
  // documento, así que "el último" es siempre el que está realmente
  // visible/activo en cada momento — sin necesitar que cada modal pase su
  // propio ref.
  useEffect(() => {
    if (!active) return undefined;

    const previouslyFocused = document.activeElement;

    // Se espera un frame para que el modal ya esté pintado en el DOM antes
    // de intentar enfocar algo dentro de él.
    const raf = requestAnimationFrame(() => {
      const shells = document.querySelectorAll('.modal-shell');
      const shell = shells[shells.length - 1];
      if (!shell) return;
      const focusable = shell.querySelector(FOCUSABLE_SELECTOR);
      if (focusable) focusable.focus();
    });

    const handleTab = (e) => {
      if (e.key !== 'Tab') return;
      const shells = document.querySelectorAll('.modal-shell');
      const shell = shells[shells.length - 1];
      if (!shell) return;
      const focusables = Array.from(shell.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetParent !== null
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleTab);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', handleTab);
      // Devuelve el foco a quien abrió el modal, solo si ese elemento
      // sigue existiendo en el documento (pudo haberse quitado del DOM
      // mientras el modal estaba abierto).
      if (
        previouslyFocused &&
        typeof previouslyFocused.focus === 'function' &&
        document.contains(previouslyFocused)
      ) {
        previouslyFocused.focus();
      }
    };
  }, [active]);
}
