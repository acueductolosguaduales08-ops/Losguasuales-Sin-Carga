import {
  Home,
  ClipboardList,
  MessageSquareWarning,
  Share2,
  Receipt,
  FileText,
  UserCircle2,
  Users,
  Gauge,
  Droplet,
  Wallet,
  CreditCard,
  CalendarRange,
  AlertTriangle,
  FileBarChart,
  LayoutDashboard,
  History,
  BellPlus,
  Settings,
  LogIn,
  QrCode,
  Trash2,
  MessageCircle,
  ShieldAlert,
  HelpCircle,
  MoreHorizontal as MoreHorizontalIcon,
  GitCompareArrows,
  Waves,
  HandCoins,
  Scale,
} from 'lucide-react';

// Fuente única de verdad para la navegación de toda la app: la usan tanto
// el menú lateral (Header.jsx) como la barra de navegación inferior
// (BottomNav.jsx), para que un mismo item (ruta, ícono, roles que pueden
// verlo) nunca quede desincronizado entre los dos.
//
// type: 'anchor' navega al Home y baja a la sección; 'route' navega a otra
// página. `search` agrega un query string al navegar (p. ej. abrir el
// Tesorería con el modal de cobro ya visible).
//
// El menú lateral agrupa las funciones por las 9 áreas del centro de
// operaciones (Asociados, Facturación, Pagos y recibos, Tesorería,
// Multas, Períodos contables, Informes, Comunidad y Administración),
// de modo que el panel principal y el menú compartan la misma lectura
// del sistema.
export const MENU_SECTIONS = [
  {
    title: 'Principal',
    items: [
      { name: 'Inicio', type: 'route', to: '/', roles: ['ASOCIADO', 'TESORERO', 'ADMINISTRADOR', null], icon: Home },
    ],
  },
  {
    title: 'Centro de operaciones',
    items: [
      {
        name: 'Centro de operaciones',
        subtitle: 'Módulos y ciclo del mes',
        type: 'route',
        to: '/panel',
        roles: ['TESORERO', 'ADMINISTRADOR'],
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: 'Asociados',
    items: [
      {
        name: 'Asociados',
        subtitle: 'Directorio y estados de cuenta',
        type: 'route',
        to: '/asociados',
        roles: ['TESORERO', 'ADMINISTRADOR'],
        icon: Users,
      },
      { name: 'Medidores', type: 'route', to: '/medidores', roles: ['TESORERO', 'ADMINISTRADOR'], icon: Gauge },
      { name: 'Lecturas y consumo', type: 'route', to: '/lecturas', roles: ['ADMINISTRADOR'], icon: Droplet },
    ],
  },
  {
    title: 'Facturación',
    items: [
      {
        name: 'Facturación',
        subtitle: 'Generar, consultar y anular facturas',
        type: 'route',
        to: '/facturacion',
        roles: ['TESORERO', 'ADMINISTRADOR'],
        icon: FileText,
      },
      {
        name: 'Notas de crédito',
        type: 'route',
        to: '/notas-credito',
        roles: ['TESORERO', 'ADMINISTRADOR'],
        icon: CreditCard,
      },
      {
        name: 'Deudas y cartera',
        subtitle: 'Aging de facturas vencidas',
        type: 'route',
        to: '/deudas-cartera',
        roles: ['TESORERO', 'ADMINISTRADOR'],
        icon: AlertTriangle,
      },
    ],
  },
  {
    title: 'Pagos y recibos',
    items: [
      {
        name: 'Registrar pago',
        subtitle: 'Cobro rápido de facturas y multas',
        type: 'route',
        to: '/tesoreria',
        search: '?pago=1',
        roles: ['TESORERO', 'ADMINISTRADOR'],
        icon: HandCoins,
      },
      {
        name: 'Recibos',
        subtitle: 'Consulta e impresión de comprobantes',
        type: 'route',
        to: '/recibos',
        roles: ['ASOCIADO', 'TESORERO', 'ADMINISTRADOR'],
        icon: Receipt,
      },
    ],
  },
  {
    title: 'Tesorería',
    items: [
      {
        name: 'Tesorería',
        subtitle: 'Entradas, salidas y caja',
        type: 'route',
        to: '/tesoreria',
        roles: ['TESORERO', 'ADMINISTRADOR'],
        icon: Wallet,
      },
      {
        name: 'Conciliación bancaria',
        subtitle: 'Importar extractos y conciliar',
        type: 'route',
        to: '/conciliacion',
        roles: ['TESORERO', 'ADMINISTRADOR'],
        icon: GitCompareArrows,
      },
    ],
  },
  {
    title: 'Multas',
    items: [
      {
        name: 'Multas',
        subtitle: 'Pendientes, pagadas e historial',
        type: 'route',
        to: '/multas',
        roles: ['TESORERO', 'ADMINISTRADOR'],
        icon: Scale,
      },
    ],
  },
  {
    title: 'Períodos contables',
    items: [
      {
        name: 'Períodos contables',
        subtitle: 'Años, meses, cierres e informes',
        type: 'route',
        to: '/periodos-contables',
        roles: ['TESORERO', 'ADMINISTRADOR'],
        icon: CalendarRange,
      },
    ],
  },
  {
    title: 'Informes',
    items: [
      {
        name: 'Informes',
        subtitle: 'Mensual, anual y por asociado',
        type: 'route',
        to: '/informes',
        roles: ['TESORERO', 'ADMINISTRADOR'],
        icon: FileBarChart,
      },
      {
        name: 'Panel de control',
        subtitle: 'Estadísticas del sistema',
        type: 'route',
        to: '/estadisticas',
        roles: ['TESORERO', 'ADMINISTRADOR'],
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: 'Comunidad',
    items: [
      {
        name: 'Comunidad',
        subtitle: 'Noticias y novedades',
        type: 'route',
        to: '/comunidad',
        roles: ['ASOCIADO', 'TESORERO', 'ADMINISTRADOR', null],
        icon: Home,
      },
      { name: 'Encuestas', type: 'route', to: '/encuestas', roles: ['ASOCIADO', 'TESORERO', 'ADMINISTRADOR', null], icon: ClipboardList },
      {
        name: 'Reportes de la comunidad',
        subtitle: 'Fugas, quejas y reclamos',
        type: 'route',
        to: '/reportes-comunidad',
        roles: ['ASOCIADO', 'TESORERO', 'ADMINISTRADOR', null],
        icon: MessageSquareWarning,
        badgeKey: 'reportesComunidad',
      },
      { name: 'Chat', type: 'route', to: '/chat', roles: ['ASOCIADO', 'TESORERO', 'ADMINISTRADOR'], icon: MessageCircle },
      {
        name: 'Compartir app',
        subtitle: 'QR, link y WhatsApp',
        type: 'route',
        to: '/compartir',
        roles: ['ASOCIADO', 'TESORERO', 'ADMINISTRADOR', null],
        icon: Share2,
      },
      {
        name: 'Centro de ayuda',
        subtitle: 'Como usar la plataforma',
        type: 'route',
        to: '/help',
        roles: ['ASOCIADO', 'TESORERO', 'ADMINISTRADOR', null],
        icon: HelpCircle,
      },
    ],
  },
  {
    title: 'Administración',
    items: [
      { name: 'Crear notificación', type: 'route', to: '/notificaciones/crear', roles: ['TESORERO', 'ADMINISTRADOR'], icon: BellPlus },
      { name: 'Configuración', type: 'route', to: '/configuracion', roles: ['ADMINISTRADOR', 'TESORERO'], icon: Settings },
      { name: 'Auditoría', type: 'route', to: '/auditoria', roles: ['ADMINISTRADOR'], icon: History },
      {
        name: 'Datos importantes',
        subtitle: 'Eliminación definitiva de datos',
        type: 'route',
        to: '/datos-importantes',
        roles: ['ADMINISTRADOR'],
        icon: Trash2,
      },
    ],
  },
  {
    title: 'Mi cuenta',
    items: [
      { name: 'Mi consumo', type: 'route', to: '/mi-consumo', roles: ['ASOCIADO'], icon: Waves },
      { name: 'Mis facturas', type: 'route', to: '/mis-facturas', roles: ['ASOCIADO'], icon: FileText },
      { name: 'Mis multas', type: 'route', to: '/mis-multas', roles: ['ASOCIADO'], icon: ShieldAlert },
      {
        name: 'Mi cuenta',
        subtitle: 'Perfil y contraseña',
        type: 'route',
        to: '/mi-cuenta',
        roles: ['ASOCIADO', 'TESORERO', 'ADMINISTRADOR'],
        icon: UserCircle2,
      },
    ],
  },
];

// Listado plano para lookups (título del header, búsqueda por ruta, etc.).
// Los ítems con `search` (mismo path, distinto query) quedan al final para
// que el título del header siempre muestre la página, no el atajo.
export const MENU_ITEMS = MENU_SECTIONS.flatMap((section) => section.items);

export function menuTitleForPath(pathname) {
  const exacto = MENU_ITEMS.find((item) => item.to === pathname && !item.search);
  if (exacto) return exacto.name;
  const conSearch = MENU_ITEMS.find((item) => item.to === pathname);
  return conSearch?.name || 'Home';
}

// Orden de prioridad para decidir qué items van directo en la barra de
// navegación inferior (espacio limitado, ideal 6 accesos: 4 módulos +
// dropdowns + "Más") y cuáles quedan dentro del panel "Más". No todos
// los roles pueden ver todas estas rutas: BottomNav filtra primero por
// rol y luego ordena lo que quede según esta prioridad.
//
// `label` es el texto corto que se ve en la barra; `name` es el título
// completo que se usa como encabezado del dropdown cuando aplica.
export const BOTTOM_NAV_CONFIG = {
  ADMINISTRADOR: {
    primary: [
      { type: 'link', name: 'Panel', icon: LayoutDashboard, to: '/panel' },
      {
        type: 'dropdown',
        name: 'Asociados',
        icon: Users,
        children: [
          { name: 'Directorio', icon: Users, to: '/asociados' },
          { name: 'Medidores', icon: Gauge, to: '/medidores' },
          { name: 'Lecturas y consumo', icon: Droplet, to: '/lecturas' },
        ],
      },
      {
        type: 'dropdown',
        name: 'Facturación',
        icon: FileText,
        children: [
          { name: 'Facturación', icon: FileText, to: '/facturacion' },
          { name: 'Deudas y cartera', icon: AlertTriangle, to: '/deudas-cartera' },
          { name: 'Notas de crédito', icon: CreditCard, to: '/notas-credito' },
          { name: 'Multas', icon: Scale, to: '/multas' },
        ],
      },
      {
        type: 'dropdown',
        name: 'Tesorería',
        icon: Wallet,
        children: [
          { name: 'Tesorería', icon: Wallet, to: '/tesoreria' },
          { name: 'Registrar pago', icon: HandCoins, to: '/tesoreria', search: '?pago=1' },
          { name: 'Recibos', icon: Receipt, to: '/recibos' },
          { name: 'Conciliación', icon: GitCompareArrows, to: '/conciliacion' },
        ],
      },
      {
        type: 'dropdown',
        name: 'Períodos',
        label: 'Períodos',
        icon: CalendarRange,
        children: [
          { name: 'Períodos contables', icon: CalendarRange, to: '/periodos-contables' },
          { name: 'Informes', icon: FileBarChart, to: '/informes' },
          { name: 'Panel de control', icon: LayoutDashboard, to: '/estadisticas' },
        ],
      },
      {
        type: 'dropdown',
        name: 'Más',
        icon: MoreHorizontalIcon,
        children: [
          { name: 'Chat', icon: MessageCircle, to: '/chat' },
          { name: 'Comunidad', icon: Home, to: '/comunidad' },
          { name: 'Encuestas', icon: ClipboardList, to: '/encuestas' },
          { name: 'Reportes de la comunidad', icon: MessageSquareWarning, to: '/reportes-comunidad' },
          { name: 'Crear notificación', icon: BellPlus, to: '/notificaciones/crear' },
          { name: 'Configuración', icon: Settings, to: '/configuracion' },
          { name: 'Auditoría', icon: History, to: '/auditoria' },
          { name: 'Datos importantes', icon: Trash2, to: '/datos-importantes' },
          { name: 'Mi cuenta', icon: UserCircle2, to: '/mi-cuenta' },
          { name: 'Compartir app', icon: Share2, to: '/compartir' },
          { name: 'Centro de ayuda', icon: HelpCircle, to: '/help' },
        ],
      },
    ],
  },

  // Misma estructura que ADMINISTRADOR, quitando únicamente lo que el
  // tesorero no tiene permiso de usar (Lecturas y consumo, Auditoría,
  // Datos importantes) — así ambos roles se sienten como "la misma app",
  // solo que el tesorero ve menos.
  TESORERO: {
    primary: [
      { type: 'link', name: 'Panel', icon: LayoutDashboard, to: '/panel' },
      {
        type: 'dropdown',
        name: 'Asociados',
        icon: Users,
        children: [
          { name: 'Directorio', icon: Users, to: '/asociados' },
          { name: 'Medidores', icon: Gauge, to: '/medidores' },
        ],
      },
      {
        type: 'dropdown',
        name: 'Facturación',
        icon: FileText,
        children: [
          { name: 'Facturación', icon: FileText, to: '/facturacion' },
          { name: 'Deudas y cartera', icon: AlertTriangle, to: '/deudas-cartera' },
          { name: 'Notas de crédito', icon: CreditCard, to: '/notas-credito' },
          { name: 'Multas', icon: Scale, to: '/multas' },
        ],
      },
      {
        type: 'dropdown',
        name: 'Tesorería',
        icon: Wallet,
        children: [
          { name: 'Tesorería', icon: Wallet, to: '/tesoreria' },
          { name: 'Registrar pago', icon: HandCoins, to: '/tesoreria', search: '?pago=1' },
          { name: 'Recibos', icon: Receipt, to: '/recibos' },
          { name: 'Conciliación', icon: GitCompareArrows, to: '/conciliacion' },
        ],
      },
      {
        type: 'dropdown',
        name: 'Períodos',
        label: 'Períodos',
        icon: CalendarRange,
        children: [
          { name: 'Períodos contables', icon: CalendarRange, to: '/periodos-contables' },
          { name: 'Informes', icon: FileBarChart, to: '/informes' },
          { name: 'Panel de control', icon: LayoutDashboard, to: '/estadisticas' },
        ],
      },
      {
        type: 'dropdown',
        name: 'Más',
        icon: MoreHorizontalIcon,
        children: [
          { name: 'Chat', icon: MessageCircle, to: '/chat' },
          { name: 'Comunidad', icon: Home, to: '/comunidad' },
          { name: 'Encuestas', icon: ClipboardList, to: '/encuestas' },
          { name: 'Reportes de la comunidad', icon: MessageSquareWarning, to: '/reportes-comunidad' },
          { name: 'Crear notificación', icon: BellPlus, to: '/notificaciones/crear' },
          { name: 'Configuración', icon: Settings, to: '/configuracion' },
          { name: 'Mi cuenta', icon: UserCircle2, to: '/mi-cuenta' },
          { name: 'Compartir app', icon: Share2, to: '/compartir' },
          { name: 'Centro de ayuda', icon: HelpCircle, to: '/help' },
        ],
      },
    ],
  },

  // Estructura más simple: casi todo son links directos, con "Más" como
  // único dropdown para lo que sobra.
  ASOCIADO: {
    primary: [
      { type: 'link', name: 'Inicio', icon: Home, to: '/' },
      { type: 'link', name: 'Mi consumo', icon: Waves, to: '/mi-consumo' },
      { type: 'link', name: 'Recibos', icon: Receipt, to: '/recibos' },
      { type: 'link', name: 'Mis facturas', label: 'Facturas', icon: FileText, to: '/mis-facturas' },
      { type: 'link', name: 'Mis multas', label: 'Multas', icon: ShieldAlert, to: '/mis-multas' },
      { type: 'link', name: 'Encuestas', icon: ClipboardList, to: '/encuestas' },
      { type: 'link', name: 'Mi cuenta', label: 'Cuenta', icon: UserCircle2, to: '/mi-cuenta' },
      {
        type: 'dropdown',
        name: 'Más',
        icon: MoreHorizontalIcon,
        children: [
          { name: 'Chat', icon: MessageCircle, to: '/chat' },
          { name: 'Compartir app', icon: Share2, to: '/compartir' },
          { name: 'Reportes de la comunidad', icon: MessageSquareWarning, to: '/reportes-comunidad' },
          { name: 'Escanear QR', icon: QrCode, to: '/escanear-qr' },
          { name: 'Centro de ayuda', icon: HelpCircle, to: '/help' },
        ],
      },
    ],
  },

  // Visitante sin sesión iniciada: solo lo público.
  VISITANTE: {
    primary: [
      { type: 'link', name: 'Inicio', icon: Home, to: '/' },
      { type: 'link', name: 'Encuestas', icon: ClipboardList, to: '/encuestas' },
      {
        type: 'dropdown',
        name: 'Más',
        icon: MoreHorizontalIcon,
        children: [
          { name: 'Reportes de la comunidad', icon: MessageSquareWarning, to: '/reportes-comunidad' },
          { name: 'Compartir app', icon: Share2, to: '/compartir' },
          { name: 'Centro de ayuda', icon: HelpCircle, to: '/help' },
          { name: 'Iniciar sesión', icon: LogIn, action: 'login' },
        ],
      },
    ],
  },
};

// La barra de navegación inferior es exclusiva de celular (fixed abajo,
// hasta 6 accesos). En escritorio la navegación equivalente es el menú ☰
// del Header (MENU_SECTIONS), que organiza las mismas opciones por las 9
// áreas del centro de operaciones y respeta el mismo filtro de roles.
export function getBottomNavConfig(rol) {
  return BOTTOM_NAV_CONFIG[rol] || BOTTOM_NAV_CONFIG.VISITANTE;
}
