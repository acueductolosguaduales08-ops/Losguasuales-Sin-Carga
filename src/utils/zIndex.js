// Escala centralizada de z-index para toda la app.
//
// Antes cada componente definia su propio numero literal (30, 40, 50, 60,
// 70, 75, 80, 90, 95, 120, 200, 9999...) sin relacion entre ellos. Eso
// causaba que dos overlays que deberian tener un orden claro (por ejemplo,
// un modal de confirmacion abierto ENCIMA de un formulario) a veces
// quedaran en el orden equivocado, o que el picker de emojis pareciera
// "esconderse detras" de otro elemento con un numero mas alto puesto sin
// pensar en la jerarquia real.
//
// Uso: import { Z } from '../../utils/zIndex'; style={{ zIndex: Z.modal }}
//
// Cada capa tiene un rango de 10 para poder insertar elementos relativos
// dentro de ella (ej: el boton de cerrar de un modal usa Z.modal + 1) sin
// tocar esta escala.
export const Z = {
  // Contenido normal de pagina que necesita despegarse de su fondo
  // (tarjetas con hover, botones flotantes decorativos, etc).
  base: 10,

  // Header/nav fijo en la parte superior, su sidebar/menu movil, y la
  // barra de navegacion inferior (BottomNav): misma capa jerarquica,
  // navegacion fija de la app, no contenido de pagina.
  header: 50,
  sidebarOverlay: 55, // fondo oscuro detras del menu lateral
  sidebar: 60, // el propio menu lateral

  // Elementos flotantes de la interfaz que viven "sobre" el contenido pero
  // por debajo de cualquier modal: FAB de edicion, encuesta flotante,
  // dropdown de notificaciones, toasts.
  floating: 70,
  dropdown: 75,
  toast: 80,

  // Modales de contenido (formularios, detalles, confirmaciones, galeria,
  // video, publicaciones). Es la capa donde vive la enorme mayoria de los
  // ~30 modales del proyecto: todos comparten el MISMO nivel a proposito,
  // porque nunca hay dos modales de este tipo abiertos a la vez.
  modal: 100,

  // Contenido DENTRO de un modal que necesita superponerse a otras partes
  // del mismo modal (ej: imagen expandida a pantalla completa dentro del
  // visor de galeria, picker de emojis).
  modalOverlay: 110,

  // Modales anidados: confirmaciones que se abren ENCIMA de un modal ya
  // abierto (ej: "seguro que quieres anular esta factura" sobre el detalle
  // de la factura).
  nestedModal: 130,

  // Casos especiales que deben estar realmente por encima de todo.
  errorBoundary: 200,
  intro: 9999,
};
