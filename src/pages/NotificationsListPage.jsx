import { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, Filter, X, Info, AlertTriangle, ShieldAlert, Siren, Inbox, Bell, ChevronLeft, CircleDollarSign, CircleAlert, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import { useNotifications } from '../context/NotificationsContext';
import { useAuth } from '../context/AuthContext';

const PRIORIDAD_STYLE = {
  URGENTE: { dot: 'bg-red-500', Icon: Siren, iconCls: 'text-red-500 bg-red-500/10' },
  ALTA: { dot: 'bg-red-400', Icon: ShieldAlert, iconCls: 'text-red-500 bg-red-500/10' },
  MEDIA: { dot: 'bg-amber-400', Icon: AlertTriangle, iconCls: 'text-amber-600 dark:text-amber-400 bg-amber-500/10' },
  NORMAL: { dot: 'bg-blue-400', Icon: Info, iconCls: 'text-blue-600 dark:text-blue-400 bg-blue-500/10' },
  BAJA: { dot: 'bg-emerald-400', Icon: Info, iconCls: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' },
};

const FILTROS = [
  { value: 'todas', label: 'Todas' },
  { value: 'no_leidas', label: 'No leídas' },
  { value: 'URGENTE', label: 'Urgentes' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'BAJA', label: 'Baja' },
];

const TIPO_LABEL = {
  PUBLICA: 'Pública',
  ASOCIADO: 'Privada',
  ADMINISTRATIVA: 'Interna',
};

function esAvisoTesorero(n) {
  return n.titulo === 'Aviso de Tesorería';
}

function estaRecibiendoPagos(n) {
  return n.contenidoCompleto?.includes('recibirá pagos') || n.descripcionCorta?.includes('recibirá pagos');
}

function formatFecha(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function NotificationsListPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { publicas, misNotificaciones, abrirDetalle, marcarLeida, ocultarNotificacion } = useNotifications();
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todas');
  const [tab, setTab] = useState('publicas');

  const lista = tab === 'mias' ? misNotificaciones : publicas;

  const listaFiltrada = useMemo(() => {
    let resultado = lista;
    if (filtro === 'no_leidas') {
      resultado = resultado.filter((n) => !n.leida);
    } else if (['URGENTE', 'ALTA', 'MEDIA', 'NORMAL', 'BAJA'].includes(filtro)) {
      resultado = resultado.filter((n) => n.prioridad === filtro);
    }
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      resultado = resultado.filter(
        (n) => n.titulo?.toLowerCase().includes(q) || n.descripcionCorta?.toLowerCase().includes(q)
      );
    }
    return resultado;
  }, [lista, filtro, busqueda]);

  const handleOpen = (n) => {
    abrirDetalle(n);
  };

  return (
    <div className="bg-gray-50 text-gray-800 dark:bg-gray-950 dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
      <Header />

      <main className="w-full max-w-2xl mx-auto pt-24 md:pt-28 pb-10 px-4 md:px-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-dark-muted transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
          <Bell className="w-6 h-6 text-brand" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Notificaciones</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{lista.length} notificaciones</p>
          </div>
        </div>

        {/* Búsqueda y filtros */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl p-4 shadow-sm mb-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por título o descripción..."
              className="w-full pl-10 pr-10 py-2.5 text-sm bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-xl focus:outline-none focus:border-brand transition-colors text-gray-800 dark:text-gray-100"
            />
            {busqueda && (
              <button onClick={() => setBusqueda('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTROS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFiltro(f.value)}
                className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg border transition-all ${
                  filtro === f.value
                    ? 'bg-brand text-white border-brand'
                    : 'bg-white dark:bg-gray-950 border-gray-200 dark:border-dark-muted text-gray-500 dark:text-gray-400 hover:border-brand/50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl overflow-hidden shadow-sm mb-4">
          <button
            onClick={() => setTab('publicas')}
            className={`flex-1 py-3 text-xs font-bold tracking-wide uppercase transition-colors border-b-2 ${
              tab === 'publicas' ? 'text-brand border-brand' : 'text-gray-500 dark:text-gray-400 border-transparent'
            }`}
          >
            Públicas
          </button>
          <button
            onClick={() => setTab('mias')}
            className={`flex-1 py-3 text-xs font-bold tracking-wide uppercase transition-colors border-b-2 ${
              tab === 'mias' ? 'text-brand border-brand' : 'text-gray-500 dark:text-gray-400 border-transparent'
            }`}
          >
            Mis notificaciones
          </button>
        </div>

        {/* Lista */}
        <div className="space-y-2">
          {listaFiltrada.length === 0 && (
            <div className="flex flex-col items-center text-center gap-3 py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-dark-muted shadow-sm">
              <Inbox className="w-10 h-10 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-400 dark:text-gray-500">
                {busqueda || filtro !== 'todas' ? 'No se encontraron notificaciones.' : 'No hay notificaciones por ahora.'}
              </p>
            </div>
          )}

          {listaFiltrada.map((n) => {
            const esTesorero = esAvisoTesorero(n);
            const pagosActivos = esTesorero && estaRecibiendoPagos(n);

            // Estilo especial para notificaciones de tesorería
            if (esTesorero) {
              return (
                <button
                  key={n.id}
                  onClick={() => handleOpen(n)}
                  className={`w-full flex items-start gap-3 p-4 rounded-2xl text-left transition-colors hover:opacity-90 border-l-4 group ${
                    pagosActivos
                      ? 'border-l-emerald-500 bg-emerald-50/70 dark:bg-emerald-500/5 hover:bg-emerald-100/80 dark:hover:bg-emerald-500/10'
                      : 'border-l-red-500 bg-red-50/70 dark:bg-red-500/5 hover:bg-red-100/80 dark:hover:bg-red-500/10'
                  } bg-white dark:bg-gray-900 shadow-sm ${!n.leida ? 'ring-1 ring-emerald-300 dark:ring-emerald-700' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    pagosActivos
                      ? 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/20'
                      : 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-500/20'
                  }`}>
                    {pagosActivos ? <CircleDollarSign className="w-5 h-5" /> : <CircleAlert className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {!n.leida && <span className={`h-2 w-2 rounded-full shrink-0 ${pagosActivos ? 'bg-emerald-500' : 'bg-red-500'}`} />}
                      <p className={`text-sm ${!n.leida ? 'font-bold text-gray-800 dark:text-white' : 'font-medium text-gray-600 dark:text-gray-300'}`}>
                        {n.titulo}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{n.descripcionCorta}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">{formatFecha(n.fechaPublicacion)}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        pagosActivos
                          ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                          : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300'
                      }`}>
                        {pagosActivos ? 'Pagos activos' : 'Suspendido'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); ocultarNotificacion(n.id); }}
                    className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-all shrink-0"
                    title="Ocultar notificación"
                  >
                    <EyeOff className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  </button>
                </button>
              );
            }

            // Estilo normal para el resto
            const { dot, Icon, iconCls } = PRIORIDAD_STYLE[n.prioridad] || PRIORIDAD_STYLE.BAJA;
            return (
              <button
                key={n.id}
                onClick={() => handleOpen(n)}
                className={`w-full flex items-start gap-3 p-4 rounded-2xl text-left transition-colors hover:bg-gray-100 dark:hover:bg-dark-muted/60 bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted shadow-sm group ${
                  !n.leida ? 'ring-2 ring-brand/20 dark:ring-brand/10' : ''
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconCls}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {!n.leida && <span className={`h-2 w-2 rounded-full shrink-0 ${dot}`} />}
                    <p className={`text-sm ${!n.leida ? 'font-bold text-gray-800 dark:text-white' : 'font-medium text-gray-600 dark:text-gray-300'}`}>
                      {n.titulo}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{n.descripcionCorta}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">{formatFecha(n.fechaPublicacion)}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-dark-muted text-gray-500 dark:text-gray-400 font-medium">
                      {TIPO_LABEL[n.tipo] || n.tipo}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); ocultarNotificacion(n.id); }}
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-all shrink-0"
                  title="Ocultar notificación"
                >
                  <EyeOff className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                </button>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
