import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { CheckCheck, Info, AlertTriangle, ShieldAlert, Siren, Inbox, BellRing, BellOff, Search, Filter, ChevronRight, X, CircleDollarSign, CircleAlert, EyeOff, Trash2, Lock, Eye } from 'lucide-react';
import { useNotifications } from '../../context/NotificationsContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { NotificacionesAPI } from '../../api/notificaciones';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';

const PRIORIDAD_STYLE = {
  URGENTE: { dot: 'bg-red-500', Icon: Siren, iconCls: 'text-red-500 bg-red-500/10' },
  ALTA: { dot: 'bg-red-400', Icon: ShieldAlert, iconCls: 'text-red-500 bg-red-500/10' },
  MEDIA: { dot: 'bg-amber-400', Icon: AlertTriangle, iconCls: 'text-amber-600 dark:text-amber-400 bg-amber-500/10' },
  NORMAL: { dot: 'bg-blue-400', Icon: Info, iconCls: 'text-blue-600 dark:text-blue-400 bg-blue-500/10' },
  BAJA: { dot: 'bg-emerald-400', Icon: Info, iconCls: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' },
};

function esAvisoTesorero(n) {
  return n.titulo === 'Aviso de Tesorería';
}

function estaRecibiendoPagos(n) {
  return n.contenidoCompleto?.includes('recibirá pagos') || n.descripcionCorta?.includes('recibirá pagos');
}

const FILTROS = [
  { value: 'todas', label: 'Todas' },
  { value: 'no_leidas', label: 'No leídas' },
  { value: 'URGENTE', label: 'Urgentes' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'BAJA', label: 'Baja' },
];

function formatFecha(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function NotificationRow({ n, onOpen, onHide }) {
  const esTesorero = esAvisoTesorero(n);
  const pagosActivos = esTesorero && estaRecibiendoPagos(n);

  if (esTesorero) {
    return (
      <button
        onClick={() => onOpen(n)}
        className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors hover:opacity-90 border-l-4 group ${
          pagosActivos
            ? 'border-l-emerald-500 bg-emerald-50/70 dark:bg-emerald-500/5 hover:bg-emerald-100/80 dark:hover:bg-emerald-500/10'
            : 'border-l-red-500 bg-red-50/70 dark:bg-red-500/5 hover:bg-red-100/80 dark:hover:bg-red-500/10'
        } ${!n.leida ? 'ring-1 ring-emerald-300 dark:ring-emerald-700' : ''}`}
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          pagosActivos
            ? 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/20'
            : 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-500/20'
        }`}>
          {pagosActivos ? <CircleDollarSign className="w-4 h-4" /> : <CircleAlert className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {!n.leida && <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${pagosActivos ? 'bg-emerald-500' : 'bg-red-500'}`} />}
            <p className={`text-sm truncate ${!n.leida ? 'font-bold text-gray-800 dark:text-white' : 'font-medium text-gray-600 dark:text-gray-300'}`}>
              {n.titulo}
            </p>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{n.descripcionCorta}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] text-gray-400 dark:text-gray-500">{formatFecha(n.fechaPublicacion)}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
              pagosActivos
                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300'
            }`}>
              {pagosActivos ? 'Pagos activos' : 'Suspendido'}
            </span>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onHide(n.id); }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-all shrink-0"
          title="Ocultar notificación"
        >
          <EyeOff className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
        </button>
      </button>
    );
  }

  const { dot, Icon, iconCls } = PRIORIDAD_STYLE[n.prioridad] || PRIORIDAD_STYLE.BAJA;
  return (
    <button
      onClick={() => onOpen(n)}
      className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors hover:bg-gray-100 dark:hover:bg-dark-muted/60 group ${
        !n.leida ? 'bg-brand/[0.04] dark:bg-brand/[0.06]' : ''
      }`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${iconCls}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {!n.leida && <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dot}`} />}
          <p className={`text-sm truncate ${!n.leida ? 'font-bold text-gray-800 dark:text-white' : 'font-medium text-gray-600 dark:text-gray-300'}`}>
            {n.titulo}
          </p>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{n.descripcionCorta}</p>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{formatFecha(n.fechaPublicacion)}</p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onHide(n.id); }}
        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-all shrink-0"
        title="Ocultar notificación"
      >
        <EyeOff className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
      </button>
    </button>
  );
}

export default function NotificationsBellDropdown({ open, onClose, onVerMas }) {
  const [tab, setTab] = useState('mias');
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todas');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [showVaciarModal, setShowVaciarModal] = useState(false);
  const [vaciarPassword, setVaciarPassword] = useState('');
  const [mostrarVaciarPassword, setMostrarVaciarPassword] = useState(false);
  const [vaciando, setVaciando] = useState(false);
  const { isAuthenticated, usuario } = useAuth();
  const { success, error, warning } = useToast();
  const {
    publicas,
    misNotificaciones,
    loadingPublicas,
    loadingMias,
    abrirDetalle,
    marcarLeida,
    ocultarNotificacion,
    permisoSistema,
    activarNotificacionesSistema,
    refetchAll,
  } = useNotifications();

  useLockBodyScroll(open);

  const esAdmin = usuario?.rol === 'ADMINISTRADOR';
  const lista = tab === 'mias' ? misNotificaciones : publicas;
  const loading = tab === 'mias' ? loadingMias : loadingPublicas;

  // Filtrar y buscar
  const listaFiltrada = useMemo(() => {
    let resultado = lista;

    // Filtro por estado
    if (filtro === 'no_leidas') {
      resultado = resultado.filter((n) => !n.leida);
    } else if (['URGENTE', 'ALTA', 'MEDIA', 'NORMAL', 'BAJA'].includes(filtro)) {
      resultado = resultado.filter((n) => n.prioridad === filtro);
    }

    // Búsqueda por texto
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      resultado = resultado.filter(
        (n) =>
          n.titulo?.toLowerCase().includes(q) ||
          n.descripcionCorta?.toLowerCase().includes(q)
      );
    }

    return resultado;
  }, [lista, filtro, busqueda]);

  if (!open) return null;

  const handleOpen = (n) => {
    onClose();
    abrirDetalle(n);
  };

  const marcarTodasLeidas = () => {
    lista.filter((n) => !n.leida).forEach((n) => marcarLeida(n.id));
  };

  const handleVaciar = async () => {
    if (!vaciarPassword.trim()) {
      warning('Contraseña requerida.', 'Ingresa tu contraseña de administrador.');
      return;
    }
    setVaciando(true);
    try {
      await NotificacionesAPI.eliminarTodas(vaciarPassword);
      success('Notificaciones vaciadas.', 'Todas las notificaciones han sido eliminadas.');
      setShowVaciarModal(false);
      setVaciarPassword('');
      refetchAll();
    } catch (err) {
      error(err.message || 'Contraseña incorrecta.', 'No se pudieron eliminar las notificaciones.');
    } finally {
      setVaciando(false);
    }
  };

  return createPortal(
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden="true" />
      <div className="fixed left-2 right-2 top-[68px] sm:left-auto sm:right-4 z-50 sm:w-[380px] max-w-full max-h-[calc(100dvh-84px)] flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-dark-muted overflow-hidden animate-[modalPop_0.18s_ease]">
        {/* Header */}
        <div className="p-3.5 border-b border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950/40 flex items-center justify-between shrink-0">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Notificaciones</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMostrarFiltros((v) => !v)}
              className={`p-1.5 rounded-lg transition-colors ${mostrarFiltros ? 'bg-brand/10 text-brand' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
              title="Filtros"
            >
              <Filter className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={marcarTodasLeidas}
              className="text-[11px] font-semibold text-brand hover:text-brand-dark dark:hover:text-brand-light transition-colors flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Marcar todas
            </button>
          </div>
        </div>

        {/* Barra de búsqueda + filtros */}
        <div className="px-3 pt-2.5 pb-2 border-b border-gray-200 dark:border-dark-muted bg-gray-50/60 dark:bg-gray-950/20 shrink-0 space-y-2">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar notificaciones..."
              className="w-full pl-8 pr-8 py-2 text-xs bg-white dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-lg focus:outline-none focus:border-brand transition-colors text-gray-800 dark:text-gray-100"
            />
            {busqueda && (
              <button onClick={() => setBusqueda('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtros de prioridad */}
          {mostrarFiltros && (
            <div className="flex flex-wrap gap-1.5">
              {FILTROS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFiltro(f.value)}
                  className={`px-2 py-1 text-[10px] font-semibold rounded-lg border transition-all ${
                    filtro === f.value
                      ? 'bg-brand text-white border-brand'
                      : 'bg-white dark:bg-gray-950 border-gray-200 dark:border-dark-muted text-gray-500 dark:text-gray-400 hover:border-brand/50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notificaciones del sistema */}
        {permisoSistema === 'default' && (
          <button
            onClick={activarNotificacionesSistema}
            className="w-full flex items-center gap-2 px-3.5 py-2.5 text-[11px] font-semibold text-brand bg-brand/5 hover:bg-brand/10 border-b border-gray-200 dark:border-dark-muted transition-colors shrink-0"
          >
            <BellRing className="w-3.5 h-3.5 shrink-0" />
            Activar notificaciones fuera de la página
          </button>
        )}
        {permisoSistema === 'denied' && (
          <div className="flex items-center gap-2 px-3.5 py-2 text-[10px] text-gray-400 dark:text-gray-500 border-b border-gray-200 dark:border-dark-muted shrink-0">
            <BellOff className="w-3.5 h-3.5 shrink-0" />
            Notificaciones del sistema bloqueadas por el navegador.
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-dark-muted bg-gray-50/60 dark:bg-gray-950/20 shrink-0">
          <button
            onClick={() => setTab('mias')}
            className={`flex-1 py-2.5 text-[11px] font-bold tracking-wide uppercase transition-colors border-b-2 ${
              tab === 'mias'
                ? 'text-brand border-brand'
                : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Mis notificaciones
          </button>
          <button
            onClick={() => setTab('publicas')}
            className={`flex-1 py-2.5 text-[11px] font-bold tracking-wide uppercase transition-colors border-b-2 ${
              tab === 'publicas'
                ? 'text-brand border-brand'
                : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Públicas
          </button>
        </div>

        {/* Listado */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scroll p-2 space-y-1">
          {loading && (
            <div className="space-y-2 p-2">
              <div className="h-14 rounded-xl bg-gray-100 dark:bg-dark-muted/50 animate-pulse" />
              <div className="h-14 rounded-xl bg-gray-100 dark:bg-dark-muted/50 animate-pulse" />
            </div>
          )}

          {!loading && tab === 'mias' && !isAuthenticated && (
            <div className="flex flex-col items-center text-center gap-2 py-10 px-4">
              <Inbox className="w-8 h-8 text-gray-300 dark:text-gray-600" />
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Inicia sesión para ver tus notificaciones privadas e internas.
              </p>
            </div>
          )}

          {!loading && listaFiltrada.length === 0 && (tab === 'publicas' || isAuthenticated) && (
            <div className="flex flex-col items-center text-center gap-2 py-10 px-4">
              <Inbox className="w-8 h-8 text-gray-300 dark:text-gray-600" />
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {busqueda || filtro !== 'todas' ? 'No se encontraron notificaciones con esos filtros.' : 'No hay notificaciones por ahora.'}
              </p>
            </div>
          )}

          {!loading && listaFiltrada.map((n) => <NotificationRow key={n.id} n={n} onOpen={handleOpen} onHide={ocultarNotificacion} />)}
        </div>

        {/* Botón "Ver más detalles" */}
        {lista.length > 0 && (
          <div className="p-3 border-t border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950/40 shrink-0">
            <button
              onClick={() => {
                onClose();
                onVerMas?.();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-brand hover:text-brand-dark dark:hover:text-brand-light bg-brand/5 hover:bg-brand/10 rounded-xl transition-colors"
            >
              Ver más notificaciones
              <ChevronRight className="w-4 h-4" />
            </button>
            {esAdmin && (
              <button
                onClick={() => setShowVaciarModal(true)}
                className="w-full flex items-center justify-center gap-2 py-2 mt-1.5 text-[11px] font-semibold text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Vaciar notificaciones
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal contraseña para vaciar notificaciones */}
      {showVaciarModal && (
        <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowVaciarModal(false); setVaciarPassword(''); }} aria-hidden="true" />
          <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease]">
            <div className="p-5 space-y-4">
              <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-500" /> Vaciar notificaciones
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Se eliminarán <strong>todas</strong> las notificaciones de la base de datos. Esta acción es irreversible.
              </p>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                  Tu contraseña (confirmación de seguridad)
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <Lock className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type={mostrarVaciarPassword ? 'text' : 'password'}
                    value={vaciarPassword}
                    onChange={(e) => setVaciarPassword(e.target.value)}
                    placeholder="Contraseña del administrador"
                    autoFocus
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/40"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarVaciarPassword((v) => !v)}
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600"
                  >
                    {mostrarVaciarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button
                  onClick={() => { setShowVaciarModal(false); setVaciarPassword(''); }}
                  className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-muted text-gray-700 dark:text-white text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleVaciar}
                  disabled={!vaciarPassword.trim() || vaciando}
                  className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-red-500 hover:bg-red-600 text-white transition-all disabled:opacity-50"
                >
                  {vaciando ? 'Eliminando...' : 'Vaciar todo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}
